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
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status"); // Filter status e.g. "IDEA", "PUBLISHED"

    if (!propertyId || propertyId.trim() === "") {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    const items = await prisma.contentItem.findMany({
      where: {
        propertyId,
        ...(status && { status })
      },
      include: { brief: true, draft: true },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ items });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("List Content Items Error:", error);
    return NextResponse.json({ error: "Failed to load content items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await getAuthenticatedUser(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { propertyId, title, targetKeyword, searchIntent, contentType, priority, source, status } = body;

    if (!propertyId || !title || !targetKeyword) {
      return NextResponse.json({ error: "Missing required properties" }, { status: 400 });
    }

    const item = await prisma.contentItem.create({
      data: {
        propertyId: propertyId.toString(),
        title,
        targetKeyword,
        searchIntent: searchIntent || null,
        contentType: contentType || null,
        priority: priority || "MEDIUM",
        source: source || "MANUAL",
        status: status || "IDEA"
      }
    });

    // Log action
    const prop = await prisma.websiteProperty.findUnique({
      where: { id: propertyId.toString() },
      include: { client: true }
    });

    if (prop) {
      await prisma.activityLog.create({
        data: {
          actorEmail: user.email,
          action: "CONTENT_IDEA_CREATED",
          clientId: prop.clientId,
          clientName: prop.client.name,
          metadata: JSON.stringify({ itemId: item.id, title: item.title })
        }
      });
    }

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Create Content Item Error:", error);
    return NextResponse.json({ error: "Failed to create content item" }, { status: 500 });
  }
}
