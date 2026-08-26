import prisma from "@/lib/db";

export interface DeliveryDetail {
  id: string | number;
  clientId: string | number;
  clientName: string;
  propertyId: string | number | null;
  propertyDomain: string | null;
  type: string; // BACKLINK, CONTENT, MILESTONE
  date: string;
  description: string;
  contentDetails?: {
    title: string;
    url: string;
    wordCount: number;
  } | null;
  linkDetails?: {
    url: string;
    anchorText: string;
    targetUrl: string;
    domainAuthority: number;
  } | null;
}

export const getClientDeliveries = async (
  clientId: string | number,
  startDate: Date,
  endDate: Date
): Promise<DeliveryDetail[]> => {
  const events = await prisma.deliveryEvent.findMany({
    where: {
      clientId: clientId.toString(),
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      client: {
        select: {
          name: true,
        },
      },
      property: {
        select: {
          domain: true,
        },
      },
      contentDetails: true,
      linkDetails: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return events.map((e) => ({
    id: e.id,
    clientId: e.clientId,
    clientName: e.client?.name ?? "Unknown",
    propertyId: e.propertyId,
    propertyDomain: e.property ? e.property.domain : null,
    type: e.type,
    date: e.date.toISOString().split("T")[0],
    description: e.description,
    contentDetails: e.contentDetails
      ? {
          title: e.contentDetails.title,
          url: e.contentDetails.url,
          wordCount: e.contentDetails.wordCount,
        }
      : null,
    linkDetails: e.linkDetails
      ? {
          url: e.linkDetails.url,
          anchorText: e.linkDetails.anchorText,
          targetUrl: e.linkDetails.targetUrl,
          domainAuthority: e.linkDetails.domainAuthority,
        }
      : null,
  }));
};

export const getDeliveryOverview = async (
  startDate: Date,
  endDate: Date,
  limit: number = 10
): Promise<DeliveryDetail[]> => {
  const events = await prisma.deliveryEvent.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      client: {
        isArchived: false,
        status: "ACTIVE",
      },
    },
    include: {
      client: {
        select: {
          name: true,
        },
      },
      property: {
        select: {
          domain: true,
        },
      },
      contentDetails: true,
      linkDetails: true,
    },
    orderBy: {
      date: "desc",
    },
    take: limit,
  });

  return events.map((e) => ({
    id: e.id,
    clientId: e.clientId,
    clientName: e.client?.name ?? "Unknown",
    propertyId: e.propertyId,
    propertyDomain: e.property ? e.property.domain : null,
    type: e.type,
    date: e.date.toISOString().split("T")[0],
    description: e.description,
    contentDetails: e.contentDetails
      ? {
          title: e.contentDetails.title,
          url: e.contentDetails.url,
          wordCount: e.contentDetails.wordCount,
        }
      : null,
    linkDetails: e.linkDetails
      ? {
          url: e.linkDetails.url,
          anchorText: e.linkDetails.anchorText,
          targetUrl: e.linkDetails.targetUrl,
          domainAuthority: e.linkDetails.domainAuthority,
        }
      : null,
  }));
};
