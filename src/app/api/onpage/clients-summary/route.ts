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

    const clients = await prisma.client.findMany({
      include: {
        properties: {
          include: {
            seoAudits: {
              orderBy: { createdAt: "desc" },
              include: {
                pages: { select: { id: true, url: true } }
              }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    const formattedClients = clients.map((c) => {
      const allAudits = (c.properties || []).flatMap(p => p.seoAudits || []);
      const totalAudits = allAudits.length;
      
      const distinctUrls = new Set<string>();
      allAudits.forEach(a => {
        (a.pages || []).forEach(p => distinctUrls.add(p.url));
      });
      const urlsAudited = distinctUrls.size > 0 ? distinctUrls.size : (allAudits[0]?.pagesCrawled || 0);

      const latestAudit = allAudits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const lastAudit = latestAudit ? latestAudit.createdAt.toISOString() : null;

      const primaryProperty = c.properties?.[0];
      const domain = primaryProperty ? (primaryProperty.domain.startsWith("http") ? primaryProperty.domain : `https://${primaryProperty.domain}`) : `https://${c.name.toLowerCase().replace(/\s+/g, "")}.com`;

      return {
        id: c.id,
        name: c.name,
        domain,
        propertyId: primaryProperty?.id || null,
        totalAudits,
        urlsAudited,
        lastAudit
      };
    });

    return NextResponse.json({ clients: formattedClients });
  } catch (error: unknown) {
    console.error("On-Page Clients Summary Error:", error);
    return NextResponse.json({ error: "Failed to load on-page clients" }, { status: 500 });
  }
}
