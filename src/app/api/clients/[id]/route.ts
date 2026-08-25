import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { updateClientDetails, archiveClientRecord, restoreClientRecord } from "@/services/clientService";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        properties: {
          include: {
            connections: true,
          },
        },
        deliveryEvents: {
          include: {
            contentDetails: true,
            linkDetails: true,
          },
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Sanitize connections to prevent token leakage
    const sanitizedProperties = client.properties.map((p) => ({
      ...p,
      connections: p.connections.map((c) => {
        const { accessToken, refreshToken, ...rest } = c;
        return rest;
      }),
    }));

    return NextResponse.json({
      ...client,
      properties: sanitizedProperties,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user;
    try {
      user = await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, companyName, domain, logoUrl, status, managerName, notes, startDate, isArchived } = body;

    let client;
    if (isArchived === true) {
      client = await archiveClientRecord(user.email, clientId);
    } else if (isArchived === false && status === "ACTIVE") {
      client = await restoreClientRecord(user.email, clientId);
    } else {
      client = await updateClientDetails(user.email, clientId, {
        name,
        companyName,
        domain,
        logoUrl,
        status,
        managerName,
        notes,
        startDate,
      });
    }

    return NextResponse.json(client);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 400 });
  }
}
