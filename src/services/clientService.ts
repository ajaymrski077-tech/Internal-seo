import prisma from "@/lib/db";
import { IntegrationConnectionRecord } from "@/types/db";
import crypto from "crypto";

export interface ClientListItem {
  id: string | number;
  name: string;
  companyName: string | null;
  logoUrl: string | null;
  status: string;
  isArchived: boolean;
  shareToken: string | null;
  managerName: string | null;
  notes: string | null;
  startDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  primaryDomain: string;
  ga4Status: string; // CONNECTED, SYNC_ERROR, DISCONNECTED
  gscStatus: string;
  googleAccountConnected: boolean;
}

export interface ClientsPayload {
  clients: ClientListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Helper to normalize domain from URL input
export const normalizeDomain = (urlInput: string): string => {
  let cleaned = urlInput.trim().toLowerCase();
  
  // Remove http://, https://
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, "");
  
  // Remove trailing slashes and paths
  cleaned = cleaned.split("/")[0];
  
  // Basic validation pattern for domains
  const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  if (!domainPattern.test(cleaned)) {
    throw new Error("Invalid domain format. Enter a valid domain name like 'example.com'.");
  }
  
  return cleaned;
};

export const getClientsList = async (params: {
  search?: string;
  status?: string; // ACTIVE, ONBOARDING, PAUSED, ARCHIVED, ALL
  integration?: string; // ALL, GA4_CONNECTED, GA4_NOT_CONNECTED, GSC_CONNECTED, GSC_NOT_CONNECTED
  archived?: string; // ACTIVE_ONLY, ARCHIVED_ONLY, ALL
  sort?: string; // name_asc, name_desc, newest, oldest, updated
  page?: number;
  pageSize?: number;
}): Promise<ClientsPayload> => {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const skip = (page - 1) * pageSize;

  const whereClause: Record<string, unknown> = {};

  // 1. Archive filters
  const archivedFilter = params.archived || "ACTIVE_ONLY";
  if (archivedFilter === "ACTIVE_ONLY") {
    whereClause.isArchived = false;
  } else if (archivedFilter === "ARCHIVED_ONLY") {
    whereClause.isArchived = true;
  }

  // 2. Status filters
  if (params.status && params.status !== "ALL") {
    whereClause.status = params.status;
  }

  // 3. Search query filters
  if (params.search) {
    whereClause.OR = [
      { name: { contains: params.search } },
      { companyName: { contains: params.search } },
      { properties: { some: { domain: { contains: params.search } } } },
    ];
  }

  // 4. Integration filters
  if (params.integration && params.integration !== "ALL") {
    if (params.integration === "GA4_CONNECTED") {
      whereClause.properties = {
        some: {
          connections: {
            some: { provider: "GA4", status: "CONNECTED" }
          }
        }
      };
    } else if (params.integration === "GA4_NOT_CONNECTED") {
      whereClause.NOT = {
        properties: {
          some: {
            connections: {
              some: { provider: "GA4", status: "CONNECTED" }
            }
          }
        }
      };
    } else if (params.integration === "GSC_CONNECTED") {
      whereClause.properties = {
        some: {
          connections: {
            some: { provider: "GSC", status: "CONNECTED" }
          }
        }
      };
    } else if (params.integration === "GSC_NOT_CONNECTED") {
      whereClause.NOT = {
        properties: {
          some: {
            connections: {
              some: { provider: "GSC", status: "CONNECTED" }
            }
          }
        }
      };
    }
  }

  // 5. Sorting configurations
  let orderBy: Record<string, "asc" | "desc"> = { name: "asc" };
  const sort = params.sort || "name_asc";
  if (sort === "name_desc") orderBy = { name: "desc" };
  else if (sort === "newest") orderBy = { createdAt: "desc" };
  else if (sort === "oldest") orderBy = { createdAt: "asc" };
  else if (sort === "updated") orderBy = { updatedAt: "desc" };

  // Fetch count & records
  const [totalCount, dbClients] = await Promise.all([
    prisma.client.count({ where: whereClause }),
    prisma.client.findMany({
      where: whereClause,
      include: {
        properties: {
          include: {
            connections: {
              select: {
                id: true,
                provider: true,
                status: true,
                accessToken: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
  ]);

  // Map to List Item interfaces
  const clients: ClientListItem[] = dbClients.map((client) => {
    const primaryProperty = client.properties?.[0];
    const primaryDomain = primaryProperty ? primaryProperty.domain : "no-website.com";

    const ga4Conn = primaryProperty?.connections?.find((c: IntegrationConnectionRecord) => c.provider === "GA4");
    const gscConn = primaryProperty?.connections?.find((c: IntegrationConnectionRecord) => c.provider === "GSC");

    const ga4Status = ga4Conn ? ga4Conn.status : "DISCONNECTED";
    const gscStatus = gscConn ? gscConn.status : "DISCONNECTED";

    const googleAccountConnected = !!(ga4Conn?.accessToken || gscConn?.accessToken);

    return {
      id: client.id,
      name: client.name,
      companyName: client.companyName,
      logoUrl: client.logoUrl,
      status: client.status,
      isArchived: client.isArchived,
      shareToken: client.shareToken,
      managerName: client.managerName,
      notes: client.notes,
      startDate: client.startDate,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      primaryDomain,
      ga4Status,
      gscStatus,
      googleAccountConnected,
    };
  });

  return {
    clients,
    totalCount,
    page,
    pageSize,
  };
};

export const createClient = async (
  actorEmail: string,
  data: {
    name: string;
    companyName?: string;
    domain: string;
    logoUrl?: string;
    status: string; // ACTIVE, ONBOARDING, PAUSED
    managerName?: string;
    notes?: string;
    startDate?: string;
  }
) => {
  if (!data.name.trim()) throw new Error("Client name is required");
  if (!data.domain.trim()) throw new Error("Website URL / domain is required");
  
  const normalized = normalizeDomain(data.domain);

  // Check duplicate domains across website properties
  const duplicate = await prisma.websiteProperty.findFirst({
    where: { domain: normalized },
  });

  if (duplicate) {
    throw new Error(`Domain '${normalized}' is already registered with another client.`);
  }

  const shareToken = crypto.randomUUID();
  const startDateVal = data.startDate ? new Date(data.startDate) : new Date();

  // Run database transactions
  const client = await prisma.$transaction(async (tx) => {
    const newClient = await tx.client.create({
      data: {
        name: data.name.trim(),
        companyName: data.companyName?.trim() || null,
        logoUrl: data.logoUrl?.trim() || null,
        status: data.status,
        shareToken,
        managerName: data.managerName?.trim() || null,
        notes: data.notes?.trim() || null,
        startDate: startDateVal,
      },
    });

    await tx.websiteProperty.create({
      data: {
        clientId: newClient.id,
        name: `${data.name.trim()} Website`,
        domain: normalized,
      },
    });

    // Create Audit Log entries
    await tx.activityLog.create({
      data: {
        actorEmail,
        action: "CLIENT_CREATED",
        clientId: newClient.id,
        clientName: newClient.name,
        metadata: JSON.stringify({ companyName: data.companyName, managerName: data.managerName }),
      },
    });

    await tx.activityLog.create({
      data: {
        actorEmail,
        action: "WEBSITE_CHANGED",
        clientId: newClient.id,
        clientName: newClient.name,
        metadata: JSON.stringify({ domain: normalized, name: `${data.name.trim()} Website` }),
      },
    });

    return newClient;
  });

  return client;
};

export const updateClientDetails = async (
  actorEmail: string,
  clientId: string | number,
  data: {
    name?: string;
    companyName?: string | null;
    domain?: string;
    logoUrl?: string | null;
    status?: string;
    managerName?: string | null;
    notes?: string | null;
    startDate?: string | null;
  }
) => {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) {
    if (!data.name.trim()) throw new Error("Client name cannot be empty");
    updateData.name = data.name.trim();
  }
  if (data.companyName !== undefined) updateData.companyName = data.companyName;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.managerName !== undefined) updateData.managerName = data.managerName;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.startDate !== undefined) {
    updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  }

  const updatedClient = await prisma.$transaction(async (tx) => {
    const original = await tx.client.findUnique({
      where: { id: clientId },
      include: { properties: true }
    });
    if (!original) throw new Error("Client not found");

    // Handle domain updates
    if (data.domain !== undefined) {
      const normalized = normalizeDomain(data.domain);
      const primaryProperty = original.properties[0];

      // Check duplicate domain
      const duplicate = await tx.websiteProperty.findFirst({
        where: { 
          domain: normalized,
          clientId: { not: clientId }
        },
      });

      if (duplicate) {
        throw new Error(`Domain '${normalized}' is already registered with another client.`);
      }

      if (primaryProperty) {
        if (primaryProperty.domain !== normalized) {
          await tx.websiteProperty.update({
            where: { id: primaryProperty.id },
            data: { domain: normalized },
          });

          await tx.activityLog.create({
            data: {
              actorEmail,
              action: "WEBSITE_CHANGED",
              clientId,
              clientName: updateData.name || original.name,
              metadata: JSON.stringify({ oldDomain: primaryProperty.domain, newDomain: normalized }),
            },
          });
        }
      } else {
        await tx.websiteProperty.create({
          data: {
            clientId,
            name: `${updateData.name || original.name} Website`,
            domain: normalized,
          },
        });
      }
    }

    const client = await tx.client.update({
      where: { id: clientId },
      data: updateData,
    });

    await tx.activityLog.create({
      data: {
        actorEmail,
        action: "CLIENT_UPDATED",
        clientId,
        clientName: client.name,
        metadata: JSON.stringify({ changes: Object.keys(updateData) }),
      },
    });

    return client;
  });

  return updatedClient;
};

export const archiveClientRecord = async (actorEmail: string, clientId: string | number) => {
  const client = await prisma.$transaction(async (tx) => {
    const original = await tx.client.findUnique({ where: { id: clientId } });
    if (!original) throw new Error("Client not found");

    const updated = await tx.client.update({
      where: { id: clientId },
      data: {
        isArchived: true,
        status: "ARCHIVED",
      },
    });

    await tx.activityLog.create({
      data: {
        actorEmail,
        action: "CLIENT_ARCHIVED",
        clientId,
        clientName: updated.name,
      },
    });

    return updated;
  });
  return client;
};

export const restoreClientRecord = async (actorEmail: string, clientId: string | number) => {
  const client = await prisma.$transaction(async (tx) => {
    const original = await tx.client.findUnique({ where: { id: clientId } });
    if (!original) throw new Error("Client not found");

    const updated = await tx.client.update({
      where: { id: clientId },
      data: {
        isArchived: false,
        status: "ACTIVE",
      },
    });

    await tx.activityLog.create({
      data: {
        actorEmail,
        action: "CLIENT_RESTORED",
        clientId,
        clientName: updated.name,
      },
    });

    return updated;
  });
  return client;
};

export const regenerateShareTokenRecord = async (actorEmail: string, clientId: string | number) => {
  const shareToken = crypto.randomUUID();
  
  const client = await prisma.$transaction(async (tx) => {
    const original = await tx.client.findUnique({ where: { id: clientId } });
    if (!original) throw new Error("Client not found");

    const updated = await tx.client.update({
      where: { id: clientId },
      data: { shareToken },
    });

    await tx.activityLog.create({
      data: {
        actorEmail,
        action: "SHARE_LINK_REGENERATED",
        clientId,
        clientName: updated.name,
      },
    });

    return updated;
  });
  return client;
};
