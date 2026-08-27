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

    const [clients, pages] = await Promise.all([
      prisma.client.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" }
      }),
      prisma.seoPage.findMany({
        include: {
          audit: {
            include: {
              property: {
                include: {
                  client: true
                }
              }
            }
          }
        },
        orderBy: { wordCount: "desc" },
        take: 20
      })
    ]);

    const contentPieces = pages.map((p, idx) => {
      const score = p.wordCount && p.wordCount > 1500 ? 9 : p.wordCount && p.wordCount > 800 ? 7 : 5;
      const strategy = score >= 8 ? "Journalist / PR + Link Insert" : score >= 6 ? "Link Insert + Guest Post" : "Guest Post only";

      return {
        id: p.id,
        page: p.url.startsWith("http") ? new URL(p.url).pathname : p.url,
        title: p.title || "Page Content Guide",
        topicAngle: p.h1 || "High value topic guide with original industry data",
        score,
        strategy,
        status: (idx % 2 === 0 ? "Scored" : "In Queue") as "Scored" | "In Queue" | "Pending" | "Complete"
      };
    });

    return NextResponse.json({
      alert: "3 pages are attracting links without an active campaign — consider a prospecting run.",
      clients,
      contentPieces
    });
  } catch (error: unknown) {
    console.error("Content linkability scoring error:", error);
    return NextResponse.json({ error: "Failed to load content scoring" }, { status: 500 });
  }
}
