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

    const [clients, opportunities] = await Promise.all([
      prisma.client.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" }
      }),
      prisma.linkOpportunity.findMany({
        include: {
          campaign: {
            include: {
              client: true
            }
          }
        },
        orderBy: { discoveredAt: "desc" },
        take: 30
      })
    ]);

    const queueItems = opportunities.map((op) => ({
      id: op.id,
      domain: op.domain || "website.com",
      dr: op.authorityMetric || 40,
      traffic: 5000,
      rd: 120,
      campaign: op.campaign?.name || "Outreach Campaign",
      contactUrl: op.websiteUrl || `https://${op.domain}/contact`,
      email: op.contactEmail || "",
      name: op.contactName || ""
    }));

    return NextResponse.json({
      summary: {
        totalWaiting: opportunities.length,
        showing: queueItems.length,
        completedToday: 0
      },
      clients,
      queueItems
    });
  } catch (error: unknown) {
    console.error("VA Queue API Error:", error);
    return NextResponse.json({ error: "Failed to load VA queue" }, { status: 500 });
  }
}
