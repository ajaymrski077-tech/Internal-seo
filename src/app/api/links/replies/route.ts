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

    const { searchParams } = new URL(req.url);
    const clientFilter = searchParams.get("client") || "All";
    const categoryFilter = searchParams.get("category") || "All";

    const [clients, opportunities] = await Promise.all([
      prisma.client.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" }
      }),
      prisma.linkOpportunity.findMany({
        where: {
          status: {
            in: ["CONTACTED", "FOLLOW_UP", "NEGOTIATING", "APPROVED", "ACQUIRED"]
          }
        },
        include: {
          campaign: {
            include: {
              client: true
            }
          }
        },
        orderBy: { updatedAt: "desc" },
        take: 30
      })
    ]);

    const threads = opportunities.map((op, idx) => {
      const clientName = op.campaign?.client?.name || "Client";
      const campaignName = op.campaign?.name || "Outreach Campaign";
      const sender = op.contactName || op.domain.replace(/\..*$/, "");
      const time = new Date(op.updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

      return {
        id: op.id,
        sender,
        time,
        campaign: campaignName,
        snippet: op.notes || `Hello, thank you for reaching out regarding collaboration opportunities on ${op.domain}...`,
        client: clientName,
        category: idx % 3 === 0 ? "Interested" : idx % 3 === 1 ? "Price" : "Soft No",
        fullMessage: op.notes || `Hello,\n\nThanks for contacting us regarding editorial inclusion on ${op.domain}.\n\nPlease send through your proposed topic outline and target URL for our editorial board review.\n\nBest regards,\n${sender}`
      };
    });

    const clientPills = ["All", ...clients.map(c => c.name)];
    const categoryPills = ["All", "Interested", "Price", "Soft No", "Hard No", "OOO", "Linked", "Link Secured", "Wrong"];

    return NextResponse.json({
      totalReplies: threads.length,
      clientPills,
      categoryPills,
      threads
    });
  } catch (error: unknown) {
    console.error("Reply Inbox Error:", error);
    return NextResponse.json({ error: "Failed to load reply inbox" }, { status: 500 });
  }
}
