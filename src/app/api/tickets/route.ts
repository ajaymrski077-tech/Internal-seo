import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "All";
    const clientId = searchParams.get("clientId") || "All";
    const archived = searchParams.get("archived") === "true";

    let where: any = {};
    
    // Apply status filter
    if (status !== "All") {
      where.status = status.toLowerCase();
    }
    
    // Apply client filter
    if (clientId !== "All") {
      where.clientId = clientId;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        client: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error("Tickets fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, clientId, fromName, status, priority, assignedTo } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: "Ticket subject is required." }, { status: 400 });
    }
    if (!clientId) {
      return NextResponse.json({ error: "Client assignment is required." }, { status: 400 });
    }
    if (!fromName || !fromName.trim()) {
      return NextResponse.json({ error: "Sender name (From) is required." }, { status: 400 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject: subject.trim(),
        clientId: clientId.toString(),
        fromName: fromName.trim(),
        status: status || "open",
        priority: priority || "normal",
        assignedTo: assignedTo || "—",
      },
      include: {
        client: { select: { name: true } }
      }
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error("Ticket creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create ticket" }, { status: 500 });
  }
}
