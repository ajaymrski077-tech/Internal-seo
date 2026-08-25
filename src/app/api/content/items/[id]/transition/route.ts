import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { transitionContentStatus } from "@/services/contentService";
import prisma from "@/lib/db";

export async function POST(
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

    const body = await req.json();
    const { newStatus, publishDate, liveUrl, pubNotes } = body;

    if (!newStatus) {
      return NextResponse.json({ error: "New status is required" }, { status: 400 });
    }

    // Call service layer for transition validation and save
    const updated = await transitionContentStatus(itemId, newStatus, user.email);

    // If publishing, save live publication details
    if (newStatus === "PUBLISHED") {
      await prisma.contentItem.update({
        where: { id: itemId },
        data: {
          ...(liveUrl && { liveUrl }),
          ...(publishDate && { publishDate: new Date(publishDate) }),
          ...(pubNotes && { pubNotes })
        }
      });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("Transition Content Status Error:", error);
    return NextResponse.json({ error: error.message || "Failed to transition status" }, { status: 400 });
  }
}
