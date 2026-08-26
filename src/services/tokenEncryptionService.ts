import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes standard for GCM

const getKey = (): Buffer => {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is required and not set");
  }
  // Standardize key size to exactly 32 bytes using SHA-256
  return crypto.createHash("sha256").update(secret).digest();
};

/**
 * Encrypts a token using AES-256-GCM.
 * Output format: enc:hexIV:hexCiphertext:hexTag
 */
export const encryptToken = (text: string): string => {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `enc:${iv.toString("hex")}:${encrypted}:${tag}`;
};

/**
 * Decrypts an encrypted token.
 * Supports legacy plaintext fallback: if the token does not start with "enc:",
 * it returns the token unmodified.
 */
export const decryptToken = (encryptedText: string): string => {
  if (!encryptedText) return "";
  
  // Legacy plaintext fallback
  if (!encryptedText.startsWith("enc:")) {
    return encryptedText;
  }
  
  const parts = encryptedText.split(":");
  if (parts.length !== 4) {
    throw new Error("Malformed encrypted token structure");
  }
  
  const [, ivHex, encryptedHex, tagHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
