import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getClientIdeasData, createClientIdea } from "@/services/contentService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";

    const data = await getClientIdeasData(clientId, status);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Client ideas API error:", error);
    return NextResponse.json({ error: errObj?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await params;
    const body = await req.json();

    if (!body.targetKeyword || body.targetKeyword.trim() === "") {
      return NextResponse.json({ error: "Target keyword is required." }, { status: 400 });
    }

    const created = await createClientIdea(clientId, body);
    return NextResponse.json({ success: true, idea: created });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Create idea API error:", error);
    return NextResponse.json({ error: errObj?.message || "Internal server error" }, { status: 500 });
  }
}
