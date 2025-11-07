import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(env.MESSAGE_ENCRYPTION_KEY, "utf-8");
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Encrypts a plain text string
export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, KEY, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Combine IV, authTag, and encrypted data into a single string
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString(
    "hex"
  )}`;
}

// Decrypts a string encrypted by the encrypt() function
export function decrypt(hash: string): string {
  try {
    const parts = hash.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format.");
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption failed:", error);
    // Return a safe string if decryption fails
    return "[Decryption Error: Data may be corrupt]";
  }
}
