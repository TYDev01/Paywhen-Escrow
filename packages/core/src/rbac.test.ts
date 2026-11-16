import { describe, it, expect } from "vitest";
import { hasPermission, permissionsFor } from "./rbac.js";

describe("rbac", () => {
  it("grants buyer the ability to create and fund", () => {
    expect(hasPermission(["BUYER"], "agreement:create")).toBe(true);
    expect(hasPermission(["BUYER"], "transaction:fund")).toBe(true);
  });

  it("denies buyers dispute resolution and money approval", () => {
    expect(hasPermission(["BUYER"], "dispute:resolve")).toBe(false);
    expect(hasPermission(["BUYER"], "payout:approve")).toBe(false);
  });

  it("unions permissions across multiple roles", () => {
    const perms = permissionsFor(["BUYER", "SELLER"]);
    expect(perms.has("delivery:submit")).toBe(true);
    expect(perms.has("delivery:inspect")).toBe(true);
  });

  it("restricts money approval to admins", () => {
    expect(hasPermission(["ADMIN"], "refund:approve")).toBe(true);
    expect(hasPermission(["DISPUTE_AGENT"], "refund:approve")).toBe(false);
  });
});
