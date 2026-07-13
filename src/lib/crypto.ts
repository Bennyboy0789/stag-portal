import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { env } from "./env";

// AES-256-GCM encryption for secrets at rest (e.g. the Google refresh token).
// The key is derived from JWT_SECRET so no extra env variable is needed.
function encryptionKey(): Buffer {
  return createHash("sha256").update(env.jwtSecret).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted]
    .map((buf) => buf.toString("base64"))
    .join(".");
}

export function decryptSecret(payload: string): string | null {
  try {
    const [iv, tag, encrypted] = payload
      .split(".")
      .map((part) => Buffer.from(part, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
