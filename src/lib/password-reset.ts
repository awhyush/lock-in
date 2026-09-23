import { randomBytes, createHash } from "node:crypto";

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only this hash is ever stored — the raw token lives solely in the emailed link. */
export function hashResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
