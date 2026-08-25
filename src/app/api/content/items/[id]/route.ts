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

    const item = await prisma.contentItem.findUnique({
      where: { id: itemId },
      include: { brief: true, draft: true }
    });

    if (!item) {
      return NextResponse.json({ error: "Content item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error("Get Content Item Error:", error);
    return NextResponse.json({ error: "Failed to load content item" }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await req.json();
    const { title, targetKeyword, searchIntent, contentType, priority, liveUrl, publishDate, pubNotes } = body;

    const item = await prisma.contentItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return NextResponse.json({ error: "Content item not found" }, { status: 404 });
    }

    const updated = await prisma.contentItem.update({
      where: { id: itemId },
      data: {
        ...(title !== undefined && { title }),
        ...(targetKeyword !== undefined && { targetKeyword }),
        ...(searchIntent !== undefined && { searchIntent }),
        ...(contentType !== undefined && { contentType }),
        ...(priority !== undefined && { priority }),
        ...(liveUrl !== undefined && { liveUrl }),
        ...(publishDate !== undefined && { publishDate: publishDate ? new Date(publishDate) : null }),
        ...(pubNotes !== undefined && { pubNotes })
      },
      include: { brief: true, draft: true }
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("Update Content Item Error:", error);
    return NextResponse.json({ error: "Failed to update content item" }, { status: 500 });
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
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const item = await prisma.contentItem.findUnique({
      where: { id: itemId },
      include: { property: true }
    });

    if (!item) {
      return NextResponse.json({ error: "Content item not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.contentItem.delete({ where: { id: itemId } });

      // Log action
      await tx.activityLog.create({
        data: {
          actorEmail: user.email,
          action: "CONTENT_ITEM_DELETED",
          clientId: item.property.clientId,
          clientName: "System",
          metadata: JSON.stringify({ itemId, title: item.title })
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Content Item Error:", error);
    return NextResponse.json({ error: "Failed to delete content item" }, { status: 500 });
  }
}
