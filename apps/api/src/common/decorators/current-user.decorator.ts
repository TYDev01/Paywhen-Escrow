import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Role, Permission } from "@escrow/core";

export interface AuthUser {
  id: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
