// Cache refresh comment to clear IDE type errors
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
    const search = searchParams.get("search") || "";

    const where: any = {};

    if (status !== "All") {
      where.status = status.toUpperCase();
    }

    if (clientId !== "All") {
      where.clientId = clientId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { assignedTo: { contains: search } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        client: { select: { name: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Tasks load error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
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
    const { title, description, status, priority, assignedTo, clientId, dueDate, prCampaignId, linkCampaignId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Task title is required." }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description || null,
        status: status || "TODO",
        priority: priority || "NORMAL",
        assignedTo: assignedTo || null,
        clientId: clientId ? clientId.toString() : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        prCampaignId: prCampaignId ? prCampaignId.toString() : null,
        linkCampaignId: linkCampaignId ? linkCampaignId.toString() : null,
      },
      include: {
        client: { select: { name: true } }
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error("Task create error:", error);
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
  }
}
