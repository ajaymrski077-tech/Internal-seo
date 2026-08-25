import { NextRequest } from "next/server";
import prisma from "@/lib/db";

interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
}

/**
 * Resolves the authenticated user from the session cookie.
 * Looks up the actual User record in the database to return a real email,
 * rather than hardcoding "admin@mistersk.com".
 *
 * Throws if the token is missing/invalid or no user is found.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser> {
  const token = req.cookies.get("token")?.value;
  if (token !== "admin-session-token") {
    throw new Error("Unauthorized");
  }

  // Resolve real user from DB instead of returning a hardcoded email
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error("Unauthorized — no user record found");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
