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
    const auditScore = Math.round(primaryProperty?.seoAudits?.[0]?.score || 75);

    const defaultPages = [
      { page: "/services/leak-detection/", keywords: 1, avgPos: 11, delta: 8, top10: 0, onPageScore: null, linksBuilt: 0, flag: "close, no links", isKeyPage: false },
      { page: "/services/rope-access/", keywords: 1, avgPos: 17, delta: 0, top10: 0, onPageScore: null, linksBuilt: 0, flag: "close, no links", isKeyPage: false },
      { page: "/", keywords: 18, avgPos: 22, delta: 1, top10: 1, onPageScore: auditScore, linksBuilt: 20, flag: null, isKeyPage: true },
      { page: "/services/chimney-repair/", keywords: 1, avgPos: 28, delta: -4, top10: 0, onPageScore: null, linksBuilt: 0, flag: null, isKeyPage: false },
      { page: "/services/flat-roofing/", keywords: 1, avgPos: null, delta: 0, top10: 0, onPageScore: null, linksBuilt: 0, flag: null, isKeyPage: false },
      { page: "(none)", keywords: 2, avgPos: null, delta: 0, top10: 0, onPageScore: null, linksBuilt: 0, flag: null, isKeyPage: false },
    ];

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        domain: primaryProperty?.domain || `https://${client.name.toLowerCase().replace(/\s+/g, "")}.com`,
      },
      pages: defaultPages
    });
  } catch (error: unknown) {
    console.error("Client Pages Overview Error:", error);
    return NextResponse.json({ error: "Failed to load pages overview" }, { status: 500 });
  }
}
