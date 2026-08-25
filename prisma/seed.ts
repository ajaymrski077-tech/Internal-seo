import prisma from "../src/lib/db";
import crypto from "crypto";

async function main() {
  console.log("==================================================");
  console.log("SEEDING MONGODB ATLAS (mistersk_seo)...");
  console.log("==================================================");

  // 1. Seed Admin User
  console.log("Checking Admin user...");
  const existingUser = await prisma.user.findFirst({ where: { email: "admin@mistersk.com" } });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: "admin@mistersk.com",
        name: "Admin User",
        password: "password123",
      },
    });
    console.log("Created admin user: admin@mistersk.com / password123");
  } else {
    console.log("Admin user already exists.");
  }

  // 2. Clear existing clients to ensure clean state
  await prisma.client.deleteMany();
  await prisma.websiteProperty.deleteMany();
  await prisma.integrationConnection.deleteMany();
  await prisma.analyticsSnapshot.deleteMany();
  await prisma.deliveryEvent.deleteMany();
  await prisma.trackedKeyword.deleteMany();
  await prisma.keywordRankingSnapshot.deleteMany();
  await prisma.linkCampaign.deleteMany();
  await prisma.prCampaign.deleteMany();
  await prisma.seoAudit.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.task.deleteMany();
  await prisma.report.deleteMany();
  await prisma.contentItem.deleteMany();
  console.log("Cleared existing collections.");

  // 3. Seed Client 1: Roost
  console.log("Seeding Client 1: Roost...");
  const roost = await prisma.client.create({
    data: {
      name: "Roost",
      companyName: "Roost Technology Inc.",
      status: "ACTIVE",
      isArchived: false,
      shareToken: crypto.randomUUID(),
      managerName: "Ajay",
      startDate: new Date("2026-01-15"),
    },
  });

  const roostProp = await prisma.websiteProperty.create({
    data: {
      clientId: roost.id,
      name: "Roost Main Site",
      domain: "roost-inky.vercel.app",
      brandType: "Branded",
      brandKeywords: "roost, roost app",
    },
  });

  // Connect GSC & GA4
  await prisma.integrationConnection.create({
    data: {
      propertyId: roostProp.id,
      provider: "GSC",
      status: "CONNECTED",
      syncStatus: "SUCCESS",
      externalId: "https://roost-inky.vercel.app/",
      lastSyncTime: new Date(),
    },
  });

  await prisma.integrationConnection.create({
    data: {
      propertyId: roostProp.id,
      provider: "GA4",
      status: "CONNECTED",
      syncStatus: "SUCCESS",
      externalId: "properties/398271829",
      lastSyncTime: new Date(),
    },
  });

  // 30 days of snapshots for Roost
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const traffic = Math.floor(180 + Math.random() * 90 + (30 - i) * 3);
    const sessions = Math.floor(traffic * 1.35);
    const conversions = Math.floor(traffic * 0.045);
    const impressions = traffic * 18;
    const pos = parseFloat((12.4 - (30 - i) * 0.08 + (Math.random() * 0.8 - 0.4)).toFixed(1));

    await prisma.analyticsSnapshot.create({
      data: {
        propertyId: roostProp.id,
        date: d,
        sessions,
        organicTraffic: traffic,
        conversions,
        gscImpressions: impressions,
        gscPosition: pos,
      },
    });
  }

  // Tracked keywords for Roost
  const kw1 = await prisma.trackedKeyword.create({
    data: {
      clientId: roost.id,
      propertyId: roostProp.id,
      keyword: "remote team housing app",
      normalizedKeyword: "remote team housing app",
      status: "ACTIVE",
      tags: "Core, High Intent",
      targetUrl: "https://roost-inky.vercel.app/features",
    },
  });

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    await prisma.keywordRankingSnapshot.create({
      data: {
        trackedKeywordId: kw1.id,
        date: d,
        position: parseFloat((14.5 - (30 - i) * 0.2 + (Math.random() * 0.4)).toFixed(1)),
        clicks: Math.floor(12 + Math.random() * 8),
        impressions: Math.floor(250 + Math.random() * 100),
        ctr: 0.048,
      },
    });
  }

  // 4. Seed Client 2: MisterSk
  console.log("Seeding Client 2: MisterSk...");
  const mistersk = await prisma.client.create({
    data: {
      name: "MisterSk",
      companyName: "MisterSK Infotech LLP",
      status: "ACTIVE",
      isArchived: false,
      shareToken: crypto.randomUUID(),
      managerName: "Ajay",
      startDate: new Date("2026-02-01"),
    },
  });

  const misterskProp = await prisma.websiteProperty.create({
    data: {
      clientId: mistersk.id,
      name: "MisterSK Infotech Agency",
      domain: "misterskinfotech.com",
      brandType: "Branded",
      brandKeywords: "mistersk, mistersk infotech",
    },
  });

  await prisma.integrationConnection.create({
    data: {
      propertyId: misterskProp.id,
      provider: "GSC",
      status: "CONNECTED",
      syncStatus: "SUCCESS",
      externalId: "sc-domain:misterskinfotech.com",
      lastSyncTime: new Date(),
    },
  });

  await prisma.integrationConnection.create({
    data: {
      propertyId: misterskProp.id,
      provider: "GA4",
      status: "CONNECTED",
      syncStatus: "SUCCESS",
      externalId: "properties/412891920",
      lastSyncTime: new Date(),
    },
  });

  // Snapshots for MisterSk
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const traffic = Math.floor(340 + Math.random() * 120 + (30 - i) * 6);
    const sessions = Math.floor(traffic * 1.4);
    const conversions = Math.floor(traffic * 0.06);
    const impressions = traffic * 22;
    const pos = parseFloat((8.8 - (30 - i) * 0.05 + (Math.random() * 0.6 - 0.3)).toFixed(1));

    await prisma.analyticsSnapshot.create({
      data: {
        propertyId: misterskProp.id,
        date: d,
        sessions,
        organicTraffic: traffic,
        conversions,
        gscImpressions: impressions,
        gscPosition: pos,
      },
    });
  }

  // Keywords for MisterSk
  const kw2 = await prisma.trackedKeyword.create({
    data: {
      clientId: mistersk.id,
      propertyId: misterskProp.id,
      keyword: "enterprise seo agency india",
      normalizedKeyword: "enterprise seo agency india",
      status: "ACTIVE",
      tags: "Commercial, Money Keyword",
      targetUrl: "https://misterskinfotech.com/seo-services",
    },
  });

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    await prisma.keywordRankingSnapshot.create({
      data: {
        trackedKeywordId: kw2.id,
        date: d,
        position: parseFloat((6.2 - (30 - i) * 0.08 + (Math.random() * 0.3)).toFixed(1)),
        clicks: Math.floor(25 + Math.random() * 15),
        impressions: Math.floor(580 + Math.random() * 150),
        ctr: 0.052,
      },
    });
  }

  // Seed Link Campaign
  const linkCamp = await prisma.linkCampaign.create({
    data: {
      clientId: mistersk.id,
      name: "Q3 High DR Tech Outreach",
      status: "ACTIVE",
      priority: "HIGH",
      monthlyTarget: 5,
    },
  });

  await prisma.linkOpportunity.create({
    data: {
      campaignId: linkCamp.id,
      domain: "techcrunch.com",
      websiteName: "TechCrunch",
      websiteUrl: "https://techcrunch.com",
      contactName: "Alex Editor",
      sourceType: "PR_OUTREACH",
      status: "NEGOTIATING",
      authorityMetric: 92,
      targetPage: "https://misterskinfotech.com",
    },
  });

  // Seed PR Campaign
  await prisma.prCampaign.create({
    data: {
      clientId: mistersk.id,
      campaignName: "SaaS SEO Benchmark Study 2026",
      status: "ACTIVE",
      priority: "HIGH",
      description: "Original data study analyzing 500 SaaS search traffic trends.",
    },
  });

  // Seed Tasks
  await prisma.task.create({
    data: {
      clientId: mistersk.id,
      title: "Publish Q3 Performance Audit for MisterSk",
      description: "Review core web vitals and crawl errors.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assignedTo: "Ajay",
    },
  });

  // Seed Tickets
  await prisma.ticket.create({
    data: {
      clientId: roost.id,
      subject: "GA4 Conversion Event Tracking Configuration",
      fromName: "Sarah (Roost)",
      status: "open",
      priority: "normal",
      assignedTo: "Ajay",
    },
  });

  // Seed Reports
  await prisma.report.create({
    data: {
      clientId: mistersk.id,
      propertyId: misterskProp.id,
      name: "Monthly SEO Performance — August 2026",
      dateRange: "30d",
      startDate: new Date("2026-07-26"),
      endDate: new Date("2026-08-25"),
      comparisonRange: "PREV_PERIOD",
      status: "READY",
      sections: JSON.stringify(["overview", "sessions", "organic", "conversions", "deliveries"]),
      shareToken: crypto.randomUUID(),
    },
  });

  // Seed Content Item
  const content = await prisma.contentItem.create({
    data: {
      propertyId: roostProp.id,
      title: "10 Best Practices for Distributed Team Housing in 2026",
      targetKeyword: "distributed team housing",
      searchIntent: "Informational",
      contentType: "Blog Post",
      priority: "HIGH",
      status: "PLANNED",
    },
  });

  await prisma.contentBrief.create({
    data: {
      contentItemId: content.id,
      primaryKeywords: "distributed team housing, remote housing",
      targetAudience: "HR Leaders, Founders",
      suggestedUrl: "/blog/distributed-team-housing",
      seoTitle: "Distributed Team Housing: The 2026 Guide for Remote Companies",
      wordCountTarget: 1500,
    },
  });

  // Seed SEO Audit
  const audit = await prisma.seoAudit.create({
    data: {
      propertyId: roostProp.id,
      status: "COMPLETED",
      score: 94.5,
      pagesDiscovered: 48,
      pagesCrawled: 48,
      issuesCritical: 0,
      issuesHigh: 2,
      issuesMedium: 5,
      issuesLow: 11,
      issuesInfo: 8,
    },
  });

  await prisma.seoIssue.create({
    data: {
      auditId: audit.id,
      type: "TITLE_TOO_LONG",
      severity: "MEDIUM",
      description: "Page title exceeds 60 characters on pricing page.",
      recommendation: "Shorten title to maintain CTR in SERPs.",
      url: "https://roost-inky.vercel.app/pricing",
    },
  });

  console.log("\n==================================================");
  console.log("SEEDING COMPLETED SUCCESSFULLY ON MONGODB ATLAS!");
  console.log("Clients: Roost (#" + roost.id + "), MisterSk (#" + mistersk.id + ")");
  console.log("==================================================");
}

main().catch(console.error);
