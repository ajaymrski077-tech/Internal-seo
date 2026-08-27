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
              seoAudits: {
                orderBy: { createdAt: "desc" },
                include: {
                  pages: true,
                  issues: true
                }
              },
              trackedKeywords: true
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
              seoAudits: {
                orderBy: { createdAt: "desc" },
                include: {
                  pages: true,
                  issues: true
                }
              },
              trackedKeywords: true
            }
          }
        }
      });
    }

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const primaryProperty = client.properties?.[0];
    const audits = primaryProperty?.seoAudits || [];

    // Map audits into page records
    const auditedUrls: Array<{
      id: string;
      auditId: string;
      url: string;
      targetKeyword: string;
      profile: string;
      score: number;
      lastAudit: string;
    }> = [];

    audits.forEach((audit) => {
      let configObj: Record<string, unknown> = {};
      try {
        configObj = JSON.parse(audit.configuration || "{}");
      } catch {
        configObj = {};
      }

      const targetKeyword = (configObj.targetKeyword as string) || primaryProperty?.trackedKeywords?.[0]?.keyword || "roofers edinburgh";
      const profile = (configObj.profile as string) || "TRANSACTIONAL";
      const score = Math.round(audit.score || 75);

      if (audit.pages && audit.pages.length > 0) {
        audit.pages.forEach((p) => {
          auditedUrls.push({
            id: p.id,
            auditId: audit.id,
            url: p.url,
            targetKeyword,
            profile,
            score,
            lastAudit: audit.createdAt.toISOString()
          });
        });
      } else {
        const rootUrl = primaryProperty?.domain.startsWith("http") ? primaryProperty.domain : `https://${primaryProperty?.domain || client?.name.toLowerCase().replace(/\s+/g, "") + ".com"}`;
        auditedUrls.push({
          id: audit.id,
          auditId: audit.id,
          url: rootUrl,
          targetKeyword,
          profile,
          score,
          lastAudit: audit.createdAt.toISOString()
        });
      }
    });

    // If no audits run yet, return default baseline for this client's root domain
    if (auditedUrls.length === 0 && primaryProperty) {
      const rootUrl = primaryProperty.domain.startsWith("http") ? primaryProperty.domain : `https://${primaryProperty.domain}`;
      const defaultKeyword = primaryProperty.trackedKeywords?.[0]?.keyword || client.name.toLowerCase();
      auditedUrls.push({
        id: primaryProperty.id,
        auditId: primaryProperty.id,
        url: rootUrl,
        targetKeyword: defaultKeyword,
        profile: "TRANSACTIONAL",
        score: 75,
        lastAudit: primaryProperty.createdAt.toISOString()
      });
    }

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        domain: primaryProperty?.domain || `https://${client.name.toLowerCase().replace(/\s+/g, "")}.com`,
        propertyId: primaryProperty?.id || null
      },
      auditedUrls
    });
  } catch (error: unknown) {
    console.error("Client On-Page Audit List Error:", error);
    return NextResponse.json({ error: "Failed to load client on-page audits" }, { status: 500 });
  }
}
