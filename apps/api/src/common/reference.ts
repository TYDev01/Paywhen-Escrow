import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

/** Generate a non-guessable, human-readable reference, e.g. "ESC-7F3K9Q2M". */
export function generateReference(prefix: string): string {
  const bytes = randomBytes(8);
  let out = "";
  for (const b of bytes) {
    out += ALPHABET[b % ALPHABET.length];
  }
  return `${prefix}-${out}`;
}
