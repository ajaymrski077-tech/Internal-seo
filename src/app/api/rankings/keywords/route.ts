// Cache refresh comment to clear IDE type errors
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { trackKeyword } from "@/services/rankingsService";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientIdStr = searchParams.get("clientId");
    const propertyIdStr = searchParams.get("propertyId");
    const status = searchParams.get("status") || "ACTIVE";
    const search = searchParams.get("search") || "";
    const positionGroup = searchParams.get("positionGroup") || "All";
    
    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "50";
    const page = parseInt(pageStr, 10);
    const limit = parseInt(limitStr, 10);

    const where: any = {};
    if (clientIdStr && clientIdStr !== "All") {
      where.clientId = parseInt(clientIdStr, 10);
    }
    if (propertyIdStr && propertyIdStr !== "All") {
      where.propertyId = parseInt(propertyIdStr, 10);
    }
    if (status && status !== "All") {
      where.status = status.toUpperCase();
    }
    if (search.trim()) {
      where.keyword = { contains: search.trim() };
    }

    // Load active keywords
    const keywords = await prisma.trackedKeyword.findMany({
      where,
      include: {
        client: { select: { name: true } },
        property: { select: { domain: true } },
        snapshots: {
          orderBy: { date: "desc" },
          take: 2, // Load the latest two snapshots for position movement mapping
        }
      },
      orderBy: { keyword: "asc" }
    });

    // Filter by positionGroup in memory to make it reliable with snapshot records
    let filteredKeywords = keywords.map(kw => {
      const currSnap = kw.snapshots[0];
      const prevSnap = kw.snapshots[1];
      
      const currPos = currSnap ? currSnap.position : null;
      const prevPos = prevSnap ? prevSnap.position : null;
      
      const positionChange = (prevPos !== null && currPos !== null && prevPos !== undefined && currPos !== undefined)
        ? parseFloat((prevPos - currPos).toFixed(2))
        : null;

      return {
        ...kw,
        currentPosition: currPos,
        previousPosition: prevPos,
        positionChange,
        clicks: currSnap ? currSnap.clicks : 0,
        impressions: currSnap ? currSnap.impressions : 0,
        ctr: currSnap ? currSnap.ctr : 0.0,
      };
    });

    if (positionGroup !== "All") {
      const g = positionGroup.toLowerCase();
      filteredKeywords = filteredKeywords.filter(kw => {
        const pos = kw.currentPosition;
        if (pos === null || pos === undefined) return false;
        
        if (g === "top3") return pos <= 3;
        if (g === "top10") return pos <= 10;
        if (g === "top20") return pos <= 20;
        if (g === "strikingdistance") return pos >= 4 && pos <= 20;
        if (g === "improved") return kw.positionChange !== null && kw.positionChange > 0;
        if (g === "declined") return kw.positionChange !== null && kw.positionChange < 0;
        if (g === "highimpressions") return kw.impressions >= 100;
        if (g === "lowctr") return kw.impressions >= 100 && kw.ctr < 2.0;
        return true;
      });
    }

    // Paginate manually
    const totalCount = filteredKeywords.length;
    const startIndex = (page - 1) * limit;
    const paginated = filteredKeywords.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      keywords: paginated,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error: any) {
    console.error("List tracked keywords error:", error);
    return NextResponse.json({ error: "Failed to load tracked keywords list" }, { status: 500 });
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
    const { keyword, clientId, propertyId, targetUrl, tags } = body;

    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: "Keyword query text is required." }, { status: 400 });
    }
    if (!clientId) {
      return NextResponse.json({ error: "Client assignment is required." }, { status: 400 });
    }
    if (!propertyId) {
      return NextResponse.json({ error: "Website Property assignment is required." }, { status: 400 });
    }

    const tracked = await trackKeyword(
      parseInt(clientId, 10),
      parseInt(propertyId, 10),
      keyword,
      "MANUAL",
      targetUrl || null,
      tags || ""
    );

    return NextResponse.json(tracked, { status: 201 });
  } catch (error: any) {
    console.error("Create tracked keyword error:", error);
    return NextResponse.json({ error: error.message || "Failed to track keyword" }, { status: 500 });
  }
}
