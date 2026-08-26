import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || id.trim() === "" || id === "invalid") {
      return NextResponse.json({ error: "Invalid location ID" }, { status: 400 });
    }

    const loc = await prisma.gbpLocation.findUnique({
      where: { id }
    });

    if (!loc) {
      return NextResponse.json({ error: "GBP location not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";

    let days = 30;
    if (range === "90d") days = 90;
    else if (range === "7d") days = 7;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const snapshots = await prisma.gbpPerformanceSnapshot.findMany({
      where: {
        locationId: id,
        date: { gte: cutoffDate }
      },
      orderBy: { date: "asc" }
    });

    // Calculate aggregated totals
    let totalViewsSearch = 0;
    let totalViewsMaps = 0;
    let totalClicksWebsite = 0;
    let totalClicksCall = 0;
    let totalClicksDirections = 0;
    let totalMessages = 0;
    let totalBookings = 0;

    for (const snap of snapshots) {
      totalViewsSearch += snap.viewsSearch;
      totalViewsMaps += snap.viewsMaps;
      totalClicksWebsite += snap.clicksWebsite;
      totalClicksCall += snap.clicksCall;
      totalClicksDirections += snap.clicksDirections;
      totalMessages += snap.messages;
      totalBookings += snap.bookings;
    }

    return NextResponse.json({
      snapshots: snapshots.map((s) => ({
        date: s.date.toISOString().split("T")[0],
        viewsSearch: s.viewsSearch,
        viewsMaps: s.viewsMaps,
        clicksWebsite: s.clicksWebsite,
        clicksCall: s.clicksCall,
        clicksDirections: s.clicksDirections,
        messages: s.messages,
        bookings: s.bookings,
      })),
      totals: {
        viewsSearch: totalViewsSearch,
        viewsMaps: totalViewsMaps,
        clicksWebsite: totalClicksWebsite,
        clicksCall: totalClicksCall,
        clicksDirections: totalClicksDirections,
        messages: totalMessages,
        bookings: totalBookings,
        interactions: totalClicksWebsite + totalClicksCall + totalClicksDirections + totalMessages + totalBookings
      }
    });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Get GBP Location Performance error:", error);
    return NextResponse.json({ error: "Failed to load location performance metrics" }, { status: 500 });
  }
}
