import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Handle GET: check session
export async function GET(req: NextRequest) {
  const tokenCookie = req.cookies.get("token")?.value;

  if (tokenCookie === "admin-session-token") {
    // Return admin user
    const user = await prisma.user.findFirst();
    if (user) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

// Handle POST: Login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    // Set secure HTTP-Only cookie
    response.cookies.set("token", "admin-session-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Handle DELETE: Logout
export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  // Clear the cookie
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "strict",
    expires: new Date(0),
  });

  return response;
}
