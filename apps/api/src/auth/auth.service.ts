import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { randomBytes, createHash } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import type { RegisterDto, LoginDto } from "./dto";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private async issueTokens(user: { id: string; email: string }, meta: SessionMeta): Promise<TokenPair> {
    const accessTtl = this.config.getOrThrow<number>("JWT_ACCESS_TTL");
    const refreshTtl = this.config.getOrThrow<number>("JWT_REFRESH_TTL");

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: accessTtl,
      },
    );

    // Opaque refresh token, stored only as a hash (never recoverable from DB).
    const refreshToken = randomBytes(48).toString("base64url");
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: this.hashToken(refreshToken),
        userAgent: meta.userAgent?.slice(0, 255),
        ipAddress: meta.ipAddress,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    return { accessToken, refreshToken, expiresIn: accessTtl };
  }

  async register(dto: RegisterDto, meta: SessionMeta): Promise<TokenPair> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      // Avoid user enumeration differences elsewhere; registration is explicit.
      throw new ConflictException("An account with that email already exists");
    }
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        displayName: dto.displayName,
        passwordHash,
        profile: { create: {} },
        // Default role: a user can act as buyer and seller.
        roles: {
          create: [
            { role: { connectOrCreate: { where: { name: "BUYER" }, create: { name: "BUYER" } } } },
            { role: { connectOrCreate: { where: { name: "SELLER" }, create: { name: "SELLER" } } } },
          ],
        },
      },
    });

    // NOTE: email verification token issuance is handled by the notifications
    // module; the account stays emailVerified=false until confirmed.
    this.logger.log(`Registered user ${user.id}`);
    return this.issueTokens(user, meta);
  }

  async login(dto: LoginDto, meta: SessionMeta): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Constant-ish work regardless of user existence to resist enumeration.
    const hash = user?.passwordHash ?? "$argon2id$v=19$m=65536,t=3,p=4$0000000000000000$00000000000000000000000000000000";
    const ok = await argon2.verify(hash, dto.password).catch(() => false);
    if (!user || !ok || user.status === "DEACTIVATED") {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.issueTokens(user, meta);
  }

  async refresh(refreshToken: string, meta: SessionMeta): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    // Rotate: revoke the old session, issue a fresh pair.
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(session.user, meta);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export interface SessionMeta {
  userAgent?: string;
  ipAddress?: string;
}
