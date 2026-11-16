import { describe, it, expect } from "vitest";
import { validateEnv } from "./env";

const base = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  JWT_ACCESS_SECRET: "a-sufficiently-long-secret",
  JWT_REFRESH_SECRET: "another-sufficiently-long-secret",
};

describe("validateEnv", () => {
  it("accepts a valid development config", () => {
    const env = validateEnv({ ...base });
    expect(env.PAYMENTS_PROVIDER).toBe("none");
    expect(env.API_PORT).toBe(4000);
  });

  it("rejects a missing database url", () => {
    expect(() => validateEnv({ ...base, DATABASE_URL: undefined })).toThrow();
  });

  it("requires stripe keys when provider is stripe", () => {
    expect(() => validateEnv({ ...base, PAYMENTS_PROVIDER: "stripe" })).toThrow();
  });

  it("rejects default secrets in production", () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: "production",
        JWT_ACCESS_SECRET: "change-me-access",
      }),
    ).toThrow();
  });
});
