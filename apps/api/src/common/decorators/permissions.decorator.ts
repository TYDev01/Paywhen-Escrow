import { SetMetadata } from "@nestjs/common";
import type { Permission } from "@escrow/core";

export const PERMISSIONS_KEY = "requiredPermissions";
/** Requires the caller to hold ALL listed permissions (checked server-side). */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
