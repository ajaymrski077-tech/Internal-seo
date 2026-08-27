import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getClientContentPlanData } from "@/services/contentService";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await params;
    const data = await getClientContentPlanData(clientId);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Content plan API error:", error);
    return NextResponse.json({ error: errObj?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await params;
    const body = await req.json();

    const { itemId, scheduledDate, dueDate, assignedTo } = body;
    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const updated = await prisma.contentItem.update({
      where: { id: itemId },
      data: {
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTo: assignedTo || undefined,
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Schedule content piece error:", error);
    return NextResponse.json({ error: errObj?.message || "Internal server error" }, { status: 500 });
  }
}
