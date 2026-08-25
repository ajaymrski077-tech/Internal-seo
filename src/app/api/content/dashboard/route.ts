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
    const propertyIdStr = searchParams.get("propertyId");

    if (!propertyIdStr || isNaN(parseInt(propertyIdStr, 10))) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    const propertyId = parseInt(propertyIdStr, 10);

    // Fetch counts grouped by status
    const statusCounts = await prisma.contentItem.groupBy({
      by: ["status"],
      where: { propertyId },
      _count: { id: true }
    });

    const counts: Record<string, number> = {
      IDEA: 0,
      RESEARCH: 0,
      BRIEF: 0,
      PLANNED: 0,
      DRAFTING: 0,
      IN_REVIEW: 0,
      APPROVED: 0,
      SCHEDULED: 0,
      PUBLISHED: 0
    };

    statusCounts.forEach((group) => {
      counts[group.status] = group._count.id;
    });

    // Fetch upcoming content (scheduled or planned)
    const upcoming = await prisma.contentItem.findMany({
      where: {
        propertyId,
        status: { in: ["PLANNED", "DRAFTING", "SCHEDULED"] },
        publishDate: { not: null }
      },
      orderBy: { publishDate: "asc" },
      take: 5
    });

    // Fetch recently published items
    const recentPublish = await prisma.contentItem.findMany({
      where: {
        propertyId,
        status: "PUBLISHED"
      },
      orderBy: { updatedAt: "desc" },
      take: 5
    });

    return NextResponse.json({
      counts,
      upcoming: upcoming.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        publishDate: item.publishDate?.toISOString() || null,
        priority: item.priority
      })),
      recentPublish: recentPublish.map((item) => ({
        id: item.id,
        title: item.title,
        liveUrl: item.liveUrl,
        publishDate: item.publishDate?.toISOString() || null
      }))
    });
  } catch (error: any) {
    console.error("Content Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to load content dashboard" }, { status: 500 });
  }
}
