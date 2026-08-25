import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (token !== "admin-session-token") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api routes
  if (pathname.startsWith("/api")) {
    const isPublicApi = pathname === "/api/auth" || pathname.startsWith("/api/auth/google/callback") || pathname.startsWith("/api/share");
    if (!isPublicApi) {
      if (token !== "admin-session-token") {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
      }
    }
  }

  // Redirect /login to /admin if already logged in
  if (pathname.startsWith("/login")) {
    if (token === "admin-session-token") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/api/:path*"],
};
