// Cache refresh comment to clear IDE type errors
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { logRankingActivity } from "@/services/rankingsService";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || id.trim() === "" || id === "invalid") {
      return NextResponse.json({ error: "Invalid keyword ID" }, { status: 400 });
    }

    const keyword = await prisma.trackedKeyword.findUnique({
      where: { id },
      include: {
        client: { select: { name: true } },
        property: { select: { domain: true } },
        snapshots: {
          orderBy: { date: "asc" }
        }
      }
    });

    if (!keyword) {
      return NextResponse.json({ error: "Tracked keyword not found" }, { status: 404 });
    }

    const activityLogs = await prisma.activityLog.findMany({
      where: {
        clientId: keyword.clientId,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      ...keyword,
      activityLogs,
    });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Tracked keyword load error:", error);
    return NextResponse.json({ error: "Failed to load keyword detail" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await getAuthenticatedUser(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id || id.trim() === "" || id === "invalid") {
      return NextResponse.json({ error: "Invalid keyword ID" }, { status: 400 });
    }

    const keywordObj = await prisma.trackedKeyword.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!keywordObj) {
      return NextResponse.json({ error: "Tracked keyword not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, tags, targetUrl } = body;

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status.toUpperCase();
    if (tags !== undefined) data.tags = tags;
    if (targetUrl !== undefined) data.targetUrl = targetUrl || null;

    const updated = await prisma.trackedKeyword.update({
      where: { id },
      data,
    });

    // Log Activity
    if (status && status.toUpperCase() !== keywordObj.status) {
      const act = status.toUpperCase() === "PAUSED" ? "KEYWORD_PAUSED" : status.toUpperCase() === "ARCHIVED" ? "KEYWORD_ARCHIVED" : "KEYWORD_RESUMED";
      await logRankingActivity(
        user.email,
        act,
        keywordObj.clientId,
        keywordObj.client?.name || "Unknown",
        { keywordId: id, keyword: keywordObj.keyword }
      );
    } else {
      await logRankingActivity(
        user.email,
        "KEYWORD_UPDATED",
        keywordObj.clientId,
        keywordObj.client?.name || "Unknown",
        { keywordId: id, keyword: keywordObj.keyword }
      );
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Tracked keyword update error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to update keyword" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await getAuthenticatedUser(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id || id.trim() === "" || id === "invalid") {
      return NextResponse.json({ error: "Invalid keyword ID" }, { status: 400 });
    }

    const keywordObj = await prisma.trackedKeyword.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!keywordObj) {
      return NextResponse.json({ error: "Tracked keyword not found" }, { status: 404 });
    }

    await prisma.trackedKeyword.delete({
      where: { id },
    });

    // Log activity
    await logRankingActivity(
      user.email,
      "KEYWORD_DELETED",
      keywordObj.clientId,
      keywordObj.client?.name || "Unknown",
      { keywordId: id, keyword: keywordObj.keyword }
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Tracked keyword delete error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to delete keyword" }, { status: 500 });
  }
}
