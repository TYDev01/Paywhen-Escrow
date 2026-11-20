import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { permissionsFor, type Role } from "@escrow/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { PASSWORD_CHANGED_ACTION, passwordVersion } from "../../auth/password-version";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const request = ctx.switchToHttp().getRequest();
    const header: string | undefined = request.headers["authorization"];
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = header.slice("Bearer ".length);

    const secret = this.config.getOrThrow<string>("JWT_ACCESS_SECRET");
    let payload: { sub: string; email: string; iat?: number; credential?: string };
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret,
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    // Always re-load roles from the DB — never trust roles baked into the token.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: { include: { role: true } } },
    });
    if (!user || user.status === "DEACTIVATED") {
      throw new UnauthorizedException("Account unavailable");
    }

    if (payload.credential !== undefined) {
      if (payload.credential !== passwordVersion(user.passwordHash, secret)) {
        throw new UnauthorizedException("Credentials changed. Sign in again.");
      }
    } else {
      // Tokens issued before credential binding stay valid only until a password change.
      if (typeof payload.iat !== "number") throw new UnauthorizedException("Invalid token");
      const change = await this.prisma.auditLog.findFirst({
        where: {
          entityType: "User",
          entityId: user.id,
          action: PASSWORD_CHANGED_ACTION,
          createdAt: { gte: new Date(payload.iat * 1000) },
        },
        select: { id: true },
      });
      if (change) throw new UnauthorizedException("Credentials changed. Sign in again.");
    }

    const roles = user.roles.map((ur) => ur.role.name as Role);
    request.user = {
      id: user.id,
      email: user.email,
      roles,
      permissions: [...permissionsFor(roles)],
    };
    return true;
  }
}
