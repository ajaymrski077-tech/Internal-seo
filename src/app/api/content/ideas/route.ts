import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getGlobalIdeasData } from "@/services/contentService";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const hasOutline = searchParams.get("hasOutline") === "true";
    const search = searchParams.get("search") || "";

    const data = await getGlobalIdeasData(hasOutline, search);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Global ideas API error:", error);
    return NextResponse.json({ error: errObj?.message || "Internal server error" }, { status: 500 });
  }
}
