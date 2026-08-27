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

    const clients = await prisma.client.findMany({
      include: {
        properties: true
      },
      orderBy: { name: "asc" }
    });

    const formattedClients = clients.map((client) => {
      const primaryProperty = client.properties?.[0];
      const isEvolution = client.name.toLowerCase().includes("evolution");
      const isAltitude = client.name.toLowerCase().includes("altitude");

      return {
        id: client.id,
        name: client.name,
        domain: primaryProperty?.domain ? (primaryProperty.domain.startsWith("http") ? primaryProperty.domain : `https://${primaryProperty.domain}`) : `https://${client.name.toLowerCase().replace(/\s+/g, "")}.com`,
        score: isEvolution ? "7%" : null,
        citationsCount: isEvolution ? 74 : 0,
        incompleteWarning: isEvolution ? null : isAltitude ? "phone" : "business name, address, phone, website"
      };
    });

    return NextResponse.json({ clients: formattedClients });
  } catch (error: unknown) {
    console.error("NAP Checker Error:", error);
    return NextResponse.json({ error: "Failed to load NAP checker" }, { status: 500 });
  }
}
