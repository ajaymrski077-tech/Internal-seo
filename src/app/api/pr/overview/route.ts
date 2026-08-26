import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrOverview } from "@/services/prService";

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

    const overview = await getPrOverview(clientId);
    return NextResponse.json(overview);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("PR Overview fetch error:", error);
    return NextResponse.json({ error: "Failed to load PR overview stats" }, { status: 500 });
  }
}
