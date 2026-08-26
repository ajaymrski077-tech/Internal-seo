import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = !!session;

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api routes
  if (pathname.startsWith("/api")) {
    const isPublicApi =
      pathname === "/api/auth" ||
      pathname.startsWith("/api/auth/google/callback") ||
      pathname.startsWith("/api/cron/sync") ||
      pathname.startsWith("/api/share");
    if (!isPublicApi) {
      if (!isAuthenticated) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
      }
    }
  }

  // Redirect /login to /admin if already logged in
  if (pathname.startsWith("/login")) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/api/:path*"],
};
