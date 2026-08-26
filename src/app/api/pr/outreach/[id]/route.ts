import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { logPrActivity } from "@/services/prService";
import prisma from "@/lib/db";

export async function PATCH(
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
      return NextResponse.json({ error: "Invalid outreach ID" }, { status: 400 });
    }

    const outreach = await prisma.prOutreachRecord.findUnique({
      where: { id },
      include: {
        campaign: { include: { client: true } }
      }
    });

    if (!outreach) {
      return NextResponse.json({ error: "Outreach record not found" }, { status: 404 });
    }

    const body = await req.json();
    const { outreachStatus, sentAt, followUpDate, respondedAt, notes, contactName, contactEmail } = body;

    const data: Record<string, unknown> = {};
    if (outreachStatus !== undefined) data.outreachStatus = outreachStatus.toUpperCase();
    if (sentAt !== undefined) data.sentAt = sentAt ? new Date(sentAt) : null;
    if (followUpDate !== undefined) data.followUpDate = followUpDate ? new Date(followUpDate) : null;
    if (respondedAt !== undefined) data.respondedAt = respondedAt ? new Date(respondedAt) : null;
    if (notes !== undefined) data.notes = notes || null;
    if (contactName !== undefined) data.contactName = contactName.trim();
    if (contactEmail !== undefined) data.contactEmail = contactEmail?.trim() || null;

    const updated = await prisma.prOutreachRecord.update({
      where: { id },
      data,
      include: {
        publication: true,
        contact: true,
      }
    });

    // Log Activity on status change
    if (outreachStatus && outreachStatus.toUpperCase() !== outreach.outreachStatus) {
      await logPrActivity(
        user.email,
        "PR_OUTREACH_STATUS_CHANGED",
        outreach.campaign?.clientId || "",
        outreach.campaign?.client?.name || "Client",
        {
          campaignId: outreach.campaignId,
          campaignName: outreach.campaign?.campaignName || "",
          outreachId: outreach.id,
          publicationName: outreach.publicationName,
          oldStatus: outreach.outreachStatus,
          newStatus: outreachStatus.toUpperCase()
        }
      );
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("PR Outreach update error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to update outreach record" }, { status: 500 });
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: "Invalid outreach ID" }, { status: 400 });
    }

    const outreach = await prisma.prOutreachRecord.findUnique({
      where: { id },
      include: {
        campaign: { include: { client: true } }
      }
    });

    if (!outreach) {
      return NextResponse.json({ error: "Outreach record not found" }, { status: 404 });
    }

    await prisma.prOutreachRecord.delete({
      where: { id },
    });

    // Log Activity
    await logPrActivity(
      user.email,
      "PR_OUTREACH_DELETED",
      outreach.campaign?.clientId || "",
      outreach.campaign?.client?.name || "Client",
      { campaignId: outreach.campaignId, campaignName: outreach.campaign?.campaignName || "", outreachId: outreach.id, publicationName: outreach.publicationName }
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("PR Outreach delete error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to delete outreach record" }, { status: 500 });
  }
}
