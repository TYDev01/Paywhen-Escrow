import { createHmac } from "node:crypto";

export const PASSWORD_CHANGED_ACTION = "account.password_changed";

// Bind signed access tokens to the credential without exposing its password hash.
export function passwordVersion(passwordHash: string, secret: string) {
  return createHmac("sha256", secret)
    .update("escrow-password-version:")
    .update(passwordHash)
    .digest("base64url");
}
