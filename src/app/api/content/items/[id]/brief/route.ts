import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/db";

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
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const brief = await prisma.contentBrief.findUnique({
      where: { contentItemId: itemId }
    });

    return NextResponse.json({ brief });
  } catch (error: any) {
    console.error("Get Content Brief Error:", error);
    return NextResponse.json({ error: "Failed to load content brief" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedUser(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const body = await req.json();
    const {
      primaryKeywords,
      secondaryKeywords,
      targetAudience,
      suggestedUrl,
      seoTitle,
      metaDescription,
      wordCountTarget,
      outline,
      internalLinking,
      writerNotes
    } = body;

    const brief = await prisma.contentBrief.upsert({
      where: { contentItemId: itemId },
      update: {
        primaryKeywords: primaryKeywords || null,
        secondaryKeywords: secondaryKeywords || null,
        targetAudience: targetAudience || null,
        suggestedUrl: suggestedUrl || null,
        seoTitle: seoTitle || null,
        metaDescription: metaDescription || null,
        wordCountTarget: wordCountTarget ? parseInt(wordCountTarget, 10) : null,
        outline: outline || null,
        internalLinking: internalLinking || null,
        writerNotes: writerNotes || null
      },
      create: {
        contentItemId: itemId,
        primaryKeywords: primaryKeywords || null,
        secondaryKeywords: secondaryKeywords || null,
        targetAudience: targetAudience || null,
        suggestedUrl: suggestedUrl || null,
        seoTitle: seoTitle || null,
        metaDescription: metaDescription || null,
        wordCountTarget: wordCountTarget ? parseInt(wordCountTarget, 10) : null,
        outline: outline || null,
        internalLinking: internalLinking || null,
        writerNotes: writerNotes || null
      }
    });

    return NextResponse.json({ success: true, brief });
  } catch (error: any) {
    console.error("Save Content Brief Error:", error);
    return NextResponse.json({ error: "Failed to save content brief" }, { status: 500 });
  }
}
