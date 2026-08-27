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

    const backlinks = opportunities.map((op) => {
      const isHigh = (op.authorityMetric || 0) >= 50;
      const isMed = (op.authorityMetric || 0) >= 30 && (op.authorityMetric || 0) < 50;

      return {
        id: op.id,
        domain: op.domain || "domain.com",
        path: op.targetPage || "/guide",
        dr: op.authorityMetric || 45,
        traffic: "15k",
        linkType: op.sourceType === "GUEST_POST" ? "Guest Post" : op.sourceType === "RESOURCE_PAGE" ? "Resource Page" : "Link Insert",
        quality: (isHigh ? "Good" : isMed ? "Review" : "Good") as "Good" | "Review" | "Reject",
        firstSeen: new Date(op.discoveredAt).toLocaleDateString("en-GB"),
        status: (op.status === "PROSPECT" ? "New" : op.status === "QUALIFIED" ? "In Queue" : "Reviewed") as "New" | "Reviewed" | "In Queue" | "Ignored",
        inQueue: op.status === "QUALIFIED"
      };
    });

    return NextResponse.json({
      summary: {
        totalLinks: opportunities.length,
        newSinceLastCheck: opportunities.filter(o => o.status === "PROSPECT").length,
        worthPursuing: opportunities.filter(o => (o.authorityMetric || 0) >= 40).length,
        inProspectQueue: opportunities.filter(o => o.status === "QUALIFIED").length,
      },
      clients,
      backlinks
    });
  } catch (error: unknown) {
    console.error("Competitor Link Tracking Error:", error);
    return NextResponse.json({ error: "Failed to load competitor links" }, { status: 500 });
  }
}
