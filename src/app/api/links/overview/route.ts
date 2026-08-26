import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getLinkOverview } from "@/services/linkBuildingService";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientIdStr = searchParams.get("clientId");
    const clientId = clientIdStr && clientIdStr !== "All" ? clientIdStr : undefined;

    const overview = await getLinkOverview(clientId);
    return NextResponse.json(overview);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Link overview load error:", error);
    return NextResponse.json({ error: "Failed to load link building metrics" }, { status: 500 });
  }
}
