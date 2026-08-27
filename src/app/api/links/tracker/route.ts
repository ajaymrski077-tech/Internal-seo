import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const [clients, dbBacklinks] = await Promise.all([
      prisma.client.findMany({
        select: { id: true, name: true, properties: true },
        orderBy: { name: "asc" }
      }),
      prisma.acquiredBacklink.findMany({
        include: {
          campaign: {
            include: {
              client: true
            }
          },
          opportunity: true
        },
        orderBy: { acquiredDate: "desc" },
        take: 50
      })
    ]);

    const formattedTrackedLinks = dbBacklinks.map((link) => {
      const clientName = link.campaign?.client?.name || "Client";
      const clientCode = clientName
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 3);

      return {
        id: link.id,
        clientCode,
        sourceUrl: link.sourceUrl,
        anchor: link.anchorText || "Target Link",
        targetPage: link.targetUrl,
        dr: link.opportunity?.authorityMetric || 45,
        drDelta: 0,
        traffic: "12.4k",
        type: link.opportunity?.sourceType === "GUEST_POST" ? "Guest Post" : "Link Insert",
        follow: (link.linkType === "FOLLOW" ? "DF" : "NF") as "DF" | "NF",
        cost: "£65.00",
        assigned: link.opportunity?.contactName || "Team",
        date: new Date(link.acquiredDate).toLocaleDateString("en-GB"),
        ahrefsStatus: (link.status === "LIVE" ? "Confirmed" : link.status === "PENDING_VERIFICATION" ? "Pending" : "Confirmed") as "Confirmed" | "Not detected" | "Pending" | "HTTP only"
      };
    });

    const confirmedCount = dbBacklinks.filter((l) => l.status === "LIVE").length;

    return NextResponse.json({
      summary: {
        totalTracked: dbBacklinks.length,
        confirmedAhrefs: confirmedCount,
        lostNotDetected: dbBacklinks.filter((l) => l.status === "MISSING" || l.status === "BROKEN").length,
        untrackedDiscovered: 0,
        lastAhrefsImport: "Today",
        lastHttpCheck: "Today"
      },
      clients,
      trackedLinks: formattedTrackedLinks
    });
  } catch (error: unknown) {
    console.error("Link Tracker Error:", error);
    return NextResponse.json({ error: "Failed to load link tracker" }, { status: 500 });
  }
}
