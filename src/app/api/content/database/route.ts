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
    const clientFilter = searchParams.get("client") || "All Clients";
    const search = searchParams.get("search") || "";

    const [clients, items] = await Promise.all([
      prisma.client.findMany({
        select: { id: true, name: true, properties: true },
        orderBy: { name: "asc" }
      }),
      prisma.contentItem.findMany({
        include: {
          property: {
            include: {
              client: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    // Format all records
    const allRecords = items.map((item) => {
      const clientName = item.property?.client?.name || "Unassigned";
      const domain = item.property?.domain || "example.com";
      const url = item.targetKeyword ? `https://${domain}/${item.targetKeyword.toLowerCase().replace(/\s+/g, "-")}` : `https://${domain}/content/${item.id}`;

      return {
        id: item.id,
        clientId: item.property?.clientId || "",
        client: clientName,
        title: item.title,
        url,
        type: item.contentType || "Blog Post",
        date: new Date(item.createdAt).toISOString().split("T")[0],
        status: item.status
      };
    });

    // Apply filters
    const filteredRecords = allRecords.filter((rec) => {
      const matchesClient = clientFilter === "All Clients" || rec.client === clientFilter || rec.clientId === clientFilter;
      const matchesSearch = !search || rec.title.toLowerCase().includes(search.toLowerCase()) || rec.client.toLowerCase().includes(search.toLowerCase());
      return matchesClient && matchesSearch;
    });

    // Calculate dynamic stats from REAL database records
    const typeCounts: Record<string, number> = {};
    const clientCounts: Record<string, number> = {};

    allRecords.forEach((rec) => {
      typeCounts[rec.type] = (typeCounts[rec.type] || 0) + 1;
      clientCounts[rec.client] = (clientCounts[rec.client] || 0) + 1;
    });

    const typeStats = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
      color: type === "Blog Post" ? "#8B5CF6" : type === "Page Update" ? "#F59E0B" : "#3B82F6"
    }));

    const maxClientCount = Math.max(...Object.values(clientCounts), 1);
    const clientStats = Object.entries(clientCounts).map(([client, count]) => ({
      client,
      count,
      percentage: Math.round((count / maxClientCount) * 100),
      color: "#8B5CF6"
    }));

    return NextResponse.json({
      records: filteredRecords,
      totalCount: filteredRecords.length,
      clients: clients.map(c => ({ id: c.id, name: c.name, defaultPropertyId: c.properties?.[0]?.id })),
      typeStats,
      clientStats
    });
  } catch (error: unknown) {
    console.error("Content Database API Error:", error);
    return NextResponse.json({ error: "Failed to load content database" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const { clientId, title, url, type, targetKeyword } = body;

    if (!clientId || !title) {
      return NextResponse.json({ error: "Client and title are required" }, { status: 400 });
    }

    // Find client and property
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { properties: true }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    let property = client.properties?.[0];
    if (!property) {
      property = await prisma.websiteProperty.create({
        data: {
          clientId: client.id,
          name: `${client.name} Main Site`,
          domain: `${client.name.toLowerCase().replace(/\s+/g, "")}.com`
        }
      });
    }

    const item = await prisma.contentItem.create({
      data: {
        propertyId: property.id,
        title,
        targetKeyword: targetKeyword || title.toLowerCase(),
        contentType: type || "Blog Post",
        status: "PUBLISHED"
      }
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: unknown) {
    console.error("Add Content Record Error:", error);
    return NextResponse.json({ error: "Failed to save content record" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Record ID required" }, { status: 400 });
    }

    await prisma.contentItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete Content Record Error:", error);
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
