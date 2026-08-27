import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getContentHubData } from "@/services/contentService";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const archived = searchParams.get("archived") === "true";

    const data = await getContentHubData(search, archived);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Content hub API error:", error);
    return NextResponse.json({ error: errObj?.message || "Internal server error" }, { status: 500 });
  }
}
