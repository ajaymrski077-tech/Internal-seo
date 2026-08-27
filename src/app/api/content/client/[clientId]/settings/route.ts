import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getClientContentSettings, saveClientContentSettings } from "@/services/contentService";

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
    const settings = await getClientContentSettings(clientId);
    return NextResponse.json({ settings });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Content settings API error:", error);
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

    const saved = await saveClientContentSettings(clientId, body);
    return NextResponse.json({ success: true, settings: saved });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Save content settings error:", error);
    return NextResponse.json({ error: errObj?.message || "Internal server error" }, { status: 500 });
  }
}
