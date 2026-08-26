import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { syncPropertyData } from "@/services/analyticsService";

// This endpoint is designed to be hit by a scheduler (e.g. Vercel Cron)
// to automatically sync all active client data every night.
export async function GET(req: NextRequest) {
  try {
    // Enforce CRON_SECRET unconditionally in all environments
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    console.log("[CRON] Starting global analytics sync...");

    // 1. Fetch all properties that have at least one connected integration
    const propertiesToSync = await prisma.websiteProperty.findMany({
      where: {
        connections: {
          some: {
            status: "CONNECTED"
          }
        }
      },
      select: {
        id: true,
        domain: true,
      }
    });

    console.log(`[CRON] Found ${propertiesToSync.length} properties to sync.`);

    const results = [];

    // 2. Loop through and sync each property
    for (const property of propertiesToSync) {
      try {
        console.log(`[CRON] Syncing property ID ${property.id} (${property.domain})...`);
        // We await sequentially to avoid hitting Google API rate limits too hard
        await syncPropertyData(property.id);
        results.push({ propertyId: property.id, domain: property.domain, status: "success" });
      } catch (err: any) {
        console.error(`[CRON] Failed to sync property ID ${property.id}:`, err);
        results.push({ propertyId: property.id, domain: property.domain, status: "error", error: err.message });
      }
    }

    console.log("[CRON] Global analytics sync complete.");

    return NextResponse.json({
      success: true,
      message: `Processed ${propertiesToSync.length} properties.`,
      results
    });
  } catch (error: any) {
    console.error("[CRON] Fatal sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
