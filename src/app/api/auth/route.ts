import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSessionToken, verifySessionToken } from "@/lib/session";

// Handle GET: check session
export async function GET(req: NextRequest) {
  const tokenCookie = req.cookies.get("token")?.value;

  if (tokenCookie) {
    const session = await verifySessionToken(tokenCookie);
    if (session && session.userId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });
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
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

// Handle POST: Login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Compare with bcrypt hash (or fallback check with auto-upgrade if legacy plaintext)
    let isMatch = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      if (user.password === password) {
        isMatch = true;
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
      }
    }

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    // Set secure HTTP-Only cookie with signed JWT
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Handle DELETE: Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  
  // Clear the cookie
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
