import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { listGbpAccounts, listGbpLocations } from "@/services/gbpService";

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
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const property = await prisma.websiteProperty.findFirst({
      where: { clientId: id },
    });

    if (!property) {
      return NextResponse.json({ locations: [], error: "No property configured" });
    }

    const connection = await prisma.integrationConnection.findFirst({
      where: { propertyId: property.id, provider: "GBP" },
    });

    if (!connection) {
      return NextResponse.json({ locations: [], error: "Google Business Profile not connected" });
    }

    // 1. Fetch GMB accounts
    const accounts = await listGbpAccounts(connection.id);

    // 2. Fetch locations for each account in parallel
    const allLocations = [];
    for (const acc of accounts) {
      try {
        const locs = await listGbpLocations(connection.id, acc.name);
        for (const loc of locs) {
          allLocations.push({
            ...loc,
            accountName: acc.name,
            accountDisplayName: acc.accountName
          });
        }
      } catch (err: unknown) {
    const errObj = err as Error;
        console.error(`Failed to list GMB locations for account ${acc.name}:`, err);
      }
    }

    return NextResponse.json({ locations: allLocations });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Discover GBP Locations Error:", error);
    return NextResponse.json(
      { locations: [], error: errObj?.message || "Failed to list GMB locations" },
      { status: 500 }
    );
  }
}
