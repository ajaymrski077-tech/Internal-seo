import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createAudit, getAudits } from "@/services/seoAuditService";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyIdStr = searchParams.get("propertyId");
    const propertyId = propertyIdStr && propertyIdStr !== "All" ? propertyIdStr : undefined;
    const status = searchParams.get("status") || undefined;

    const audits = await getAudits({ propertyId, status });
    return NextResponse.json({ audits });
  } catch (error: any) {
    console.error("SEO Audits list error:", error);
    return NextResponse.json({ error: "Failed to fetch SEO audits" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, maxPages, maxDepth, respectRobots } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "Property assignment is required." }, { status: 400 });
    }

    const property = await prisma.websiteProperty.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return NextResponse.json({ error: "Website property not found." }, { status: 404 });
    }

    const auditId = await createAudit(property.id, {
      maxPages: maxPages ? parseInt(maxPages, 10) : undefined,
      maxDepth: maxDepth ? parseInt(maxDepth, 10) : undefined,
      respectRobots: respectRobots !== false,
    });

    return NextResponse.json({ success: true, auditId }, { status: 201 });
  } catch (error: any) {
    console.error("SEO Audit create error:", error);
    return NextResponse.json({ error: error.message || "Failed to start SEO audit" }, { status: 500 });
  }
}
