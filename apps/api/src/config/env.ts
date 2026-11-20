import { z } from "zod";

/**
 * Environment validation. The app refuses to boot with invalid/missing config
 * (spec §23 "environment configuration validation"). Secrets are required and
 * must not fall back to insecure defaults in production.
 */
const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    API_PORT: z.coerce.number().int().positive().default(4000),
    API_GLOBAL_PREFIX: z.string().default("api"),
    CORS_ORIGINS: z.string().default("http://localhost:3000"),

    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().optional(),

    JWT_ACCESS_SECRET: z.string().min(16),
    JWT_REFRESH_SECRET: z.string().min(16),
    JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
    JWT_REFRESH_TTL: z.coerce.number().int().positive().default(1_209_600),

    PAYMENTS_PROVIDER: z.enum(["none", "stripe"]).default("none"),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    KYC_PROVIDER: z.string().default("none"),
    KYC_DOCUMENT_KEY: z.preprocess(
      (value) => value === "" ? undefined : value,
      z.string().regex(/^[A-Za-z0-9+/]{43}=$/, "Use a base64-encoded 32-byte key").optional(),
    ),
    MAIL_TRANSPORT: z.enum(["log", "smtp"]).default("log"),
    SMTP_URL: z.string().optional(),
    MAIL_FROM: z.string().default("Escrow <no-reply@example.com>"),

    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    S3_ENDPOINT: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.PAYMENTS_PROVIDER === "stripe") {
      if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required when PAYMENTS_PROVIDER=stripe",
        });
      }
    }
    if (env.NODE_ENV === "production") {
      for (const weak of ["change-me-access", "change-me-refresh"]) {
        if (env.JWT_ACCESS_SECRET === weak || env.JWT_REFRESH_SECRET === weak) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Default JWT secrets must not be used in production",
          });
        }
      }
    }
  });

export type Env = z.infer<typeof schema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return parsed.data;
}
