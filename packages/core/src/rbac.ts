/**
 * rbac.ts — roles and permissions.
 *
 * These are the authoritative definitions. The server enforces them on every
 * protected route; frontend role checks are cosmetic only. A single user may
 * hold multiple roles (e.g. act as BUYER and SELLER).
 */

export const ROLES = [
  "BUYER",
  "SELLER",
  "ADMIN",
  "SUPPORT",
  "DISPUTE_AGENT",
  "COMPLIANCE",
] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "agreement:create",
  "agreement:accept",
  "transaction:read:own",
  "transaction:read:any",
  "transaction:fund",
  "delivery:submit",
  "delivery:inspect",
  "dispute:open",
  "dispute:message",
  "dispute:resolve",
  "payout:approve",
  "refund:approve",
  "kyc:review",
  "user:manage",
  "role:manage",
  "ledger:read",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  BUYER: [
    "agreement:create",
    "agreement:accept",
    "transaction:read:own",
    "transaction:fund",
    "delivery:inspect",
    "dispute:open",
    "dispute:message",
  ],
  SELLER: [
    "agreement:create",
    "agreement:accept",
    "transaction:read:own",
    "delivery:submit",
    "dispute:open",
    "dispute:message",
  ],
  SUPPORT: ["transaction:read:any", "dispute:message", "user:manage"],
  DISPUTE_AGENT: [
    "transaction:read:any",
    "dispute:message",
    "dispute:resolve",
    "ledger:read",
  ],
  COMPLIANCE: ["transaction:read:any", "kyc:review", "ledger:read", "audit:read"],
  ADMIN: [
    "transaction:read:any",
    "payout:approve",
    "refund:approve",
    "user:manage",
    "role:manage",
    "ledger:read",
    "audit:read",
    "kyc:review",
  ],
};

export function permissionsFor(roles: readonly Role[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const perm of ROLE_PERMISSIONS[role] ?? []) set.add(perm);
  }
  return set;
}

export function hasPermission(roles: readonly Role[], permission: Permission): boolean {
  return permissionsFor(roles).has(permission);
}
