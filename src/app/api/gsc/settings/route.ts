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

    const properties = await prisma.websiteProperty.findMany({
      orderBy: { domain: "asc" },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    const clients = await prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ properties, clients });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("GSC settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { propertyUpdates } = await req.json();

    if (!Array.isArray(propertyUpdates)) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    interface PropertyUpdate {
      id: string;
      clientId?: string | null;
      brandType?: string | null;
      brandKeywords?: string | null;
    }

    // Process updates in parallel
    await Promise.all(
      (propertyUpdates as PropertyUpdate[]).map((update) =>
        prisma.websiteProperty.update({
          where: { id: String(update.id) },
          data: {
            clientId: update.clientId ? String(update.clientId) : undefined,
            brandType: update.brandType ?? undefined,
            brandKeywords: update.brandKeywords ?? undefined,
          },
        })
      )
    );

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("GSC settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
