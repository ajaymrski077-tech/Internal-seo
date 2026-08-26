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

    const { searchParams } = req.nextUrl;
    const integration = searchParams.get("integration");

    const whereClause: Record<string, unknown> = {};
    
    if (integration === "GSC") {
      whereClause.connections = {
        some: { provider: "GSC", status: "CONNECTED" }
      };
    } else if (integration === "GA4") {
      whereClause.connections = {
        some: { provider: "GA4", status: "CONNECTED" }
      };
    }

    const properties = await prisma.websiteProperty.findMany({
      where: whereClause,
      include: {
        client: {
          select: { name: true }
        }
      },
      orderBy: {
        domain: "asc"
      }
    });

    interface PropertyWithClient {
      id: string | number;
      domain: string;
      clientId: string | number;
      client?: { name: string };
    }

    const formatted = (properties as unknown as PropertyWithClient[]).map(p => ({
      id: p.id,
      domain: p.domain,
      clientId: p.clientId,
      clientName: p.client?.name || "Client"
    }));

    return NextResponse.json({ properties: formatted });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Properties API Error:", error);
    return NextResponse.json({ error: "Failed to load properties" }, { status: 500 });
  }
}
