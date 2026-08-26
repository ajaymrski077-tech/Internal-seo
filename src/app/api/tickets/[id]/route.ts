import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

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
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        client: { select: { name: true } }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error: unknown) {
    const errObj = error as Error;
    return NextResponse.json({ error: errObj?.message || "Failed to load ticket" }, { status: 500 });
  }
}

export async function PATCH(
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
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    const body = await req.json();
    const { subject, clientId, fromName, status, priority, assignedTo } = body;

    const data: Record<string, unknown> = {};
    if (subject !== undefined) data.subject = subject.trim();
    if (clientId !== undefined) data.clientId = clientId ? clientId.toString() : undefined;
    if (fromName !== undefined) data.fromName = fromName.trim();
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (assignedTo !== undefined) data.assignedTo = assignedTo || "—";

    const ticket = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        client: { select: { name: true } }
      }
    });

    return NextResponse.json(ticket);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Ticket update error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to update ticket" }, { status: 500 });
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    await prisma.ticket.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Ticket delete error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to delete ticket" }, { status: 500 });
  }
}
