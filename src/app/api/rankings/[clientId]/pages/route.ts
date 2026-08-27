import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { clientId } = await params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(clientId);

    let client = null;
    if (isObjectId) {
      client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          properties: {
            include: {
              trackedKeywords: {
                include: {
                  snapshots: { orderBy: { date: "desc" }, take: 2 }
                }
              },
              seoAudits: {
                orderBy: { createdAt: "desc" },
                take: 1
              }
            }
          }
        }
      });
    }

    if (!client) {
      client = await prisma.client.findFirst({
        where: {
          OR: [
            { name: { contains: clientId, mode: "insensitive" } },
            { website: { contains: clientId, mode: "insensitive" } }
          ]
        },
        include: {
          properties: {
            include: {
              trackedKeywords: {
                include: {
                  snapshots: { orderBy: { date: "desc" }, take: 2 }
                }
              },
              seoAudits: {
                orderBy: { createdAt: "desc" },
                take: 1
              }
            }
          }
        }
      });
    }

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const primaryProperty = client.properties?.[0];
    const latestAudit = primaryProperty?.seoAudits?.[0];
    const auditScore = Math.round(latestAudit?.score || 75);

    let pages: any[] = [];
    if (latestAudit) {
      const seoPages = await prisma.seoPage.findMany({
        where: { auditId: latestAudit.id }
      });
      pages = seoPages.map(sp => {
        // Compute path from URL (e.g. https://domain.com/path -> /path)
        let path = sp.url;
        try {
          const urlObj = new URL(sp.url);
          path = urlObj.pathname;
        } catch {
          // Fallback to url if invalid URL
        }
        return {
          id: sp.id,
          page: path,
          keywords: 0,
          avgPos: null,
          delta: 0,
          top10: 0,
          onPageScore: auditScore,
          linksBuilt: 0,
          flag: null,
          isKeyPage: false
        };
      });
    }

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        domain: primaryProperty?.domain || `https://${client.name.toLowerCase().replace(/\s+/g, "")}.com`,
      },
      pages
    });
  } catch (error: unknown) {
    console.error("Client Pages Overview Error:", error);
    return NextResponse.json({ error: "Failed to load pages overview" }, { status: 500 });
  }
}
