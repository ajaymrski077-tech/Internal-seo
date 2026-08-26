import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { logPrActivity } from "@/services/prService";
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
    if (!id || id.trim() === "" || id === "invalid") {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const outreach = await prisma.prOutreachRecord.findMany({
      where: { campaignId: id },
      include: {
        publication: true,
        contact: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ outreach });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("PR Outreach list error:", error);
    return NextResponse.json({ error: "Failed to fetch outreach records" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await getAuthenticatedUser(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id || id.trim() === "" || id === "invalid") {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const campaign = await prisma.prCampaign.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const body = await req.json();
    const { publicationName, contactName, contactEmail, targetUrl, outreachStatus, sentAt, followUpDate, notes } = body;

    if (!publicationName || !publicationName.trim()) {
      return NextResponse.json({ error: "Publication name is required." }, { status: 400 });
    }
    if (!contactName || !contactName.trim()) {
      return NextResponse.json({ error: "Contact name is required." }, { status: 400 });
    }

    // 1. Reusable Publication Auto-create/lookup
    const pubNameTrimmed = publicationName.trim();
    let publication = await prisma.prPublication.findFirst({
      where: { name: pubNameTrimmed }
    });

    if (!publication) {
      const websiteGuess = `https://${pubNameTrimmed.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
      publication = await prisma.prPublication.create({
        data: {
          name: pubNameTrimmed,
          website: websiteGuess,
          domain: pubNameTrimmed.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com",
          domainAuthority: null,
          category: "General",
          country: "US",
        }
      });
    }

    // 2. Contact Auto-create/lookup
    const contactNameTrimmed = contactName.trim();
    let contact = await prisma.prContact.findFirst({
      where: {
        name: contactNameTrimmed,
        publicationId: publication.id
      }
    });

    if (!contact) {
      contact = await prisma.prContact.create({
        data: {
          name: contactNameTrimmed,
          email: contactEmail?.trim() || null,
          publicationId: publication.id,
          role: "Journalist / Writer",
        }
      });
    }

    // 3. Create Outreach Record
    const outreach = await prisma.prOutreachRecord.create({
      data: {
        campaignId: id,
        publicationId: publication.id,
        contactId: contact.id,
        publicationName: pubNameTrimmed,
        contactName: contactNameTrimmed,
        contactEmail: contactEmail?.trim() || null,
        targetUrl: targetUrl?.trim() || null,
        outreachStatus: outreachStatus || "NOT_CONTACTED",
        sentAt: sentAt ? new Date(sentAt) : null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || null,
      },
      include: {
        publication: true,
        contact: true,
      }
    });

    // Log Activity
    await logPrActivity(
      user.email,
      "PR_OUTREACH_ADDED",
      campaign.clientId,
      campaign.client.name,
      { campaignId: id, campaignName: campaign.campaignName, outreachId: outreach.id, publicationName: pubNameTrimmed }
    );

    return NextResponse.json(outreach, { status: 201 });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("PR Outreach create error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to create outreach record" }, { status: 500 });
  }
}
