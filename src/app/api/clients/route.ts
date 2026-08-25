import { NextRequest, NextResponse } from "next/server";
import { getClientsList, createClient } from "@/services/clientService";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";
    const integration = searchParams.get("integration") || "ALL";
    const archived = searchParams.get("archived") || "ACTIVE_ONLY";
    const sort = searchParams.get("sort") || "name_asc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const payload = await getClientsList({
      search,
      status,
      integration,
      archived,
      sort,
      page,
      pageSize,
    });

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load clients list" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { name, companyName, domain, logoUrl, status, managerName, notes, startDate } = body;

    const newClient = await createClient(user.email, {
      name,
      companyName,
      domain,
      logoUrl,
      status: status || "ACTIVE",
      managerName,
      notes,
      startDate,
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create client" }, { status: 400 });
  }
}
