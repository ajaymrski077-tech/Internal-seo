import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
  const prisma = new PrismaClient({ adapter });

  console.log("Start seeding production-grade structures with client metadata...");

  // 1. Clean database
  await prisma.activityLog.deleteMany();
  await prisma.linkDelivery.deleteMany();
  await prisma.contentDelivery.deleteMany();
  await prisma.deliveryEvent.deleteMany();
  await prisma.analyticsSnapshot.deleteMany();
  await prisma.integrationConnection.deleteMany();
  await prisma.websiteProperty.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Admin User
  const admin = await prisma.user.create({
    data: {
      email: "admin@mistersk.com",
      password: "password123",
      name: "MisterSK Admin",
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // Helper to generate dates relative to today
  const getPastDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // 3. Seed Clients & Properties with new metadata columns
  const clientsData = [
    {
      name: "Acme Corp",
      companyName: "Acme Industries Ltd",
      status: "ACTIVE",
      isArchived: false,
      shareToken: "acme-corp-secure-share-token-12345",
      managerName: "Sarah Jenkins",
      notes: "Acme values comprehensive weekly backlink updates and has a high conversion optimization focus.",
      startDate: getPastDate(120),
      properties: [
        {
          name: "Acme Primary Website",
          domain: "acmecorp.com",
          connections: [
            {
              provider: "GA4",
              status: "CONNECTED",
              syncStatus: "SUCCESS",
              lastSyncTime: getPastDate(0),
              accessToken: "mock-access-token-acme-ga4",
              refreshToken: "mock-refresh-token-acme-ga4",
              tokenExpiry: new Date(Date.now() + 3600 * 1000),
              externalId: "properties/123456789",
              conversionEventName: "purchase"
            },
            {
              provider: "GSC",
              status: "CONNECTED",
              syncStatus: "SUCCESS",
              lastSyncTime: getPastDate(0),
              accessToken: "mock-access-token-acme-gsc",
              refreshToken: "mock-refresh-token-acme-gsc",
              tokenExpiry: new Date(Date.now() + 3600 * 1000),
              externalId: "sc-domain:acmecorp.com"
            }
          ],
          trendType: "GROWING"
        }
      ]
    },
    {
      name: "Zenith Retail",
      companyName: "Zenith e-Commerce Group",
      status: "ONBOARDING",
      isArchived: false,
      shareToken: "zenith-retail-secure-share-token-67890",
      managerName: "Michael Chang",
      notes: "Onboarding phase. Google Analytics OAuth link failed because credentials expired.",
      startDate: getPastDate(15),
      properties: [
        {
          name: "Zenith Main Shop",
          domain: "zenithretail.com",
          connections: [
            {
              provider: "GA4",
              status: "SYNC_ERROR",
              syncStatus: "FAILED",
              syncError: "OAuth token expired (status code 401)",
              lastSyncTime: getPastDate(1),
              accessToken: "expired-access-token-zenith",
              refreshToken: "mock-refresh-token-zenith",
              tokenExpiry: new Date(Date.now() - 3600 * 1000),
              externalId: "properties/987654321",
              conversionEventName: "generate_lead"
            }
          ],
          trendType: "DECLINING"
        }
      ]
    },
    {
      name: "Apex Global",
      companyName: "Apex Services International",
      status: "PAUSED",
      isArchived: false,
      shareToken: "apex-global-secure-share-token-abcde",
      managerName: "Sarah Jenkins",
      notes: "Campaign temporarily paused due to client restructuring. Re-engagement scheduled next month.",
      startDate: getPastDate(200),
      properties: [
        {
          name: "Apex Corporate Portal",
          domain: "apexglobal.io",
          connections: [],
          trendType: "UNCONNECTED"
        }
      ]
    },
    {
      name: "Novamira Tech",
      companyName: "Novamira Technology Solutions LLC",
      status: "ACTIVE",
      isArchived: false,
      shareToken: "novamira-tech-secure-share-token-fghij",
      managerName: "Emily Ross",
      notes: "Active SEO operations. Awaiting client credentials to connect GSC and GA4.",
      startDate: getPastDate(45),
      properties: [
        {
          name: "Novamira Product Page",
          domain: "novamiratech.com",
          connections: [],
          trendType: "UNCONNECTED"
        }
      ]
    },
    {
      name: "Legacy Solutions",
      companyName: "Legacy Consulting Corp",
      status: "ARCHIVED",
      isArchived: true,
      shareToken: "legacy-solutions-secure-share-token-klmno",
      managerName: "Michael Chang",
      notes: "Archived account. Legacy data kept for reporting records.",
      startDate: getPastDate(300),
      properties: [
        {
          name: "Legacy Site Archive",
          domain: "legacysolutions.net",
          connections: [
            {
              provider: "GA4",
              status: "CONNECTED",
              syncStatus: "SUCCESS",
              lastSyncTime: getPastDate(0),
              accessToken: "mock-access-token-legacy",
              externalId: "properties/111222333"
            },
            {
              provider: "GSC",
              status: "CONNECTED",
              syncStatus: "SUCCESS",
              lastSyncTime: getPastDate(0),
              accessToken: "mock-access-token-legacy-gsc",
              externalId: "sc-domain:legacysolutions.net"
            }
          ],
          trendType: "FLAT"
        }
      ]
    }
  ];

  for (const c of clientsData) {
    const client = await prisma.client.create({
      data: {
        name: c.name,
        companyName: c.companyName,
        status: c.status,
        isArchived: c.isArchived,
        shareToken: c.shareToken,
        managerName: c.managerName,
        notes: c.notes,
        startDate: c.startDate,
      },
    });

    console.log(`Created Client: ${client.name}`);

    // Create CLIENT_CREATED ActivityLog
    await prisma.activityLog.create({
      data: {
        actorEmail: "admin@mistersk.com",
        action: "CLIENT_CREATED",
        clientId: client.id,
        clientName: client.name,
        metadata: JSON.stringify({ companyName: c.companyName, managerName: c.managerName }),
        createdAt: c.startDate || new Date(),
      },
    });

    for (const p of c.properties) {
      const property = await prisma.websiteProperty.create({
        data: {
          clientId: client.id,
          name: p.name,
          domain: p.domain,
        },
      });

      console.log(`  Added Website Property: ${property.domain}`);

      // Create WEBSITE_CHANGED ActivityLog
      await prisma.activityLog.create({
        data: {
          actorEmail: "admin@mistersk.com",
          action: "WEBSITE_CHANGED",
          clientId: client.id,
          clientName: client.name,
          metadata: JSON.stringify({ domain: p.domain, name: p.name }),
          createdAt: c.startDate ? new Date(c.startDate.getTime() + 60 * 60 * 1000) : new Date(), // 1 hour later
        },
      });

      // Add connections
      for (const conn of p.connections as any[]) {
        await prisma.integrationConnection.create({
          data: {
            propertyId: property.id,
            provider: conn.provider,
            status: conn.status,
            syncStatus: conn.syncStatus,
            syncError: conn.syncError || null,
            lastSyncTime: conn.lastSyncTime || null,
            accessToken: conn.accessToken || null,
            refreshToken: conn.refreshToken || null,
            tokenExpiry: conn.tokenExpiry || null,
            externalId: conn.externalId || null,
            conversionEventName: conn.conversionEventName || null,
          },
        });
        console.log(`    Created Connection: ${conn.provider} (Status: ${conn.status})`);

        // Create INTEGRATION_CONNECTED ActivityLog
        await prisma.activityLog.create({
          data: {
            actorEmail: "admin@mistersk.com",
            action: conn.status === "CONNECTED" ? "INTEGRATION_CONNECTED" : "INTEGRATION_DISCONNECTED",
            clientId: client.id,
            clientName: client.name,
            metadata: JSON.stringify({ provider: conn.provider, status: conn.status, error: conn.syncError }),
            createdAt: c.startDate ? new Date(c.startDate.getTime() + 120 * 60 * 1000) : new Date(), // 2 hours later
          },
        });
      }

      // If unconnected, do not generate analytics snapshots
      if (p.trendType === "UNCONNECTED") {
        continue;
      }

      // Generate 365 days of snapshots
      const snapshots = [];
      let baseSessions = p.trendType === "GROWING" ? 100 : p.trendType === "DECLINING" ? 300 : 200;
      let baseOrganic = p.trendType === "GROWING" ? 70 : p.trendType === "DECLINING" ? 210 : 140;
      let baseConversions = p.trendType === "GROWING" ? 5 : p.trendType === "DECLINING" ? 15 : 10;

      for (let i = 365; i >= 0; i--) {
        const date = getPastDate(i);
        
        // Add trend factor
        let trendFactor = 1.0;
        if (p.trendType === "GROWING") {
          trendFactor = 1.0 + (2.5 - 1.0) * ((365 - i) / 365);
        } else if (p.trendType === "DECLINING") {
          trendFactor = 1.0 - (1.0 - 0.4) * ((365 - i) / 365);
        }

        // Add seasonal/weekly fluctuations (weekends have lower traffic)
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dayFactor = isWeekend ? 0.6 : 1.1;

        // Random noise (+/- 10%)
        const noise = 0.9 + Math.random() * 0.2;

        const sessions = Math.round(baseSessions * trendFactor * dayFactor * noise);
        const organicTraffic = Math.round(baseOrganic * trendFactor * dayFactor * noise);
        const conversions = Math.round(baseConversions * trendFactor * dayFactor * noise);

        snapshots.push({
          propertyId: property.id,
          date,
          sessions,
          organicTraffic,
          conversions,
        });
      }

      // Bulk insert snapshots
      await prisma.analyticsSnapshot.createMany({
        data: snapshots,
      });
      console.log(`    Seeded ${snapshots.length} daily snapshots for property: ${property.domain}`);

      // Seed Delivery Events
      if (c.status !== "ARCHIVED") {
        // Event 1: Backlinks placed 12 days ago
        const linkEvent = await prisma.deliveryEvent.create({
          data: {
            clientId: client.id,
            propertyId: property.id,
            type: "BACKLINK",
            date: getPastDate(12),
            description: `Placed backlinks on authority tech blogs for ${property.domain}`,
          },
        });

        await prisma.linkDelivery.create({
          data: {
            deliveryEventId: linkEvent.id,
            url: "https://techcrunch.com/partner-article-1",
            anchorText: "innovative SaaS systems",
            targetUrl: `https://${property.domain}/products`,
            domainAuthority: 93,
          },
        });

        // Event 2: Content published 24 days ago
        const contentEvent1 = await prisma.deliveryEvent.create({
          data: {
            clientId: client.id,
            propertyId: property.id,
            type: "CONTENT",
            date: getPastDate(24),
            description: `Published SEO-optimized blog post on ${property.domain}`,
          },
        });

        await prisma.contentDelivery.create({
          data: {
            deliveryEventId: contentEvent1.id,
            title: "10 Ways to Scale Your Business Operations in 2026",
            url: `https://${property.domain}/blog/scale-operations-2026`,
            wordCount: 1850,
          },
        });

        // Event 3: Content published 5 days ago (for GROWING client only)
        if (p.trendType === "GROWING") {
          const contentEvent2 = await prisma.deliveryEvent.create({
            data: {
              clientId: client.id,
              propertyId: property.id,
              type: "CONTENT",
              date: getPastDate(5),
              description: `Published target landing page content`,
            },
          });

          await prisma.contentDelivery.create({
            data: {
              deliveryEventId: contentEvent2.id,
              title: "Ultimate Guide to Cloud Integrations",
              url: `https://${property.domain}/guide/cloud-integrations`,
              wordCount: 2200,
            },
          });
        }
      }
    }
  }

  console.log("Database seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
