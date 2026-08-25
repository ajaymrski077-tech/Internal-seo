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
    const clientIdStr = searchParams.get("clientId");
    const limitStr = searchParams.get("limit");

    const whereClause: any = {};
    if (clientIdStr && clientIdStr !== "ALL") {
      whereClause.clientId = clientIdStr;
    }

    const take = limitStr ? Math.min(parseInt(limitStr, 10) || 20, 50) : 20;

    const logs = await prisma.activityLog.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      take,
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load activity logs" }, { status: 500 });
  }
}
