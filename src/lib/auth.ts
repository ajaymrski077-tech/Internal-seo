import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { verifySessionToken } from "@/lib/session";

export interface AuthenticatedUser {
  id: string | number;
  email: string;
  name: string;
}

/**
 * Resolves the authenticated user from the signed JWT session cookie.
 * Decodes the JWT and queries the exact user by user ID.
 * Throws if the token is missing, expired/invalid, or no user record exists.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser> {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    throw new Error("Unauthorized");
  }

  const session = await verifySessionToken(token);
  if (!session || !session.userId) {
    throw new Error("Unauthorized — invalid or expired session token");
  }

  // Resolve user by exact ID from JWT payload
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    throw new Error("Unauthorized — user record not found");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
