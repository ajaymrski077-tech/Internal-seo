import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const verticals = await prisma.prVertical.findMany({
      orderBy: { sortOrder: "asc" },
    });
    
    // Add dummy usedBy just for display to avoid breaking UI 
    const mapped = verticals.map(v => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      covers: v.covers || "—",
      usedBy: "0 clients", // We don't have PR client relations yet
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching verticals:", error);
    return NextResponse.json({ error: "Failed to fetch verticals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, sortOrder, covers } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Default slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");

    const newVertical = await prisma.prVertical.create({
      data: {
        name,
        slug: finalSlug,
        sortOrder: sortOrder || 500,
        covers: covers || null,
      }
    });

    return NextResponse.json(newVertical);
  } catch (error) {
    console.error("Error creating vertical:", error);
    return NextResponse.json({ error: "Failed to create vertical" }, { status: 500 });
  }
}
