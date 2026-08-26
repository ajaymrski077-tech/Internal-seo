import { SignJWT, jwtVerify } from "jose";

const SESSION_EXPIRY = "7d";

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required and not set.");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string | number;
  email: string;
  name?: string;
}

/**
 * Creates and signs a JWT session token with HS256 algorithm and 7-day expiration.
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secretKey = getSecretKey();
  return new SignJWT({
    userId: payload.userId.toString(),
    email: payload.email,
    name: payload.name || "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .sign(secretKey);
}

/**
 * Verifies a JWT session token's cryptographic signature and expiration.
 * Returns decoded payload if valid, or null if expired/invalid.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    if (!payload.userId || typeof payload.userId !== "string") {
      return null;
    }
    return {
      userId: payload.userId,
      email: (payload.email as string) || "",
      name: (payload.name as string) || "",
    };
  } catch {
    return null;
  }
}
