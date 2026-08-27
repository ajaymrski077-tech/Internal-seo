import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const dates = await prisma.prNationalDate.findMany({
      orderBy: { nextDate: "asc" },
    });
    return NextResponse.json(dates);
  } catch (error) {
    console.error("Error fetching dates:", error);
    return NextResponse.json({ error: "Failed to fetch dates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, nextDate, rule, verticals, peg } = body;

    if (!name || !nextDate) {
      return NextResponse.json({ error: "Name and nextDate are required" }, { status: 400 });
    }

    const newDate = await prisma.prNationalDate.create({
      data: {
        name,
        type: type || "Fixed date",
        nextDate,
        rule: rule || null,
        verticals: verticals || "all",
        peg: peg || null,
      }
    });

    return NextResponse.json(newDate);
  } catch (error) {
    console.error("Error creating date:", error);
    return NextResponse.json({ error: "Failed to create date" }, { status: 500 });
  }
}
