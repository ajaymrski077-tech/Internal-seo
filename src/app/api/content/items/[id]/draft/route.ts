import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
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
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const draft = await prisma.contentDraft.findUnique({
      where: { contentItemId: itemId }
    });

    return NextResponse.json({ draft });
  } catch (error: any) {
    console.error("Get Content Draft Error:", error);
    return NextResponse.json({ error: "Failed to load content draft" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedUser(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const bodyData = await req.json();
    const { body, reviewNotes } = bodyData;

    const draft = await prisma.contentDraft.upsert({
      where: { contentItemId: itemId },
      update: {
        ...(body !== undefined && { body }),
        ...(reviewNotes !== undefined && { reviewNotes })
      },
      create: {
        contentItemId: itemId,
        body: body || null,
        reviewNotes: reviewNotes || null
      }
    });

    return NextResponse.json({ success: true, draft });
  } catch (error: any) {
    console.error("Save Content Draft Error:", error);
    return NextResponse.json({ error: "Failed to save content draft" }, { status: 500 });
  }
}
