import { createHash } from "crypto";

/**
 * Compute SHA-256 hash of input string.
 * Uses Node.js crypto module for reliable server-side hashing.
 */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
