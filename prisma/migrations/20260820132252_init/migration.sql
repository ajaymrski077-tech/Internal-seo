-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "sessions" INTEGER NOT NULL,
    "organicTraffic" INTEGER NOT NULL,
    "conversions" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsSnapshot_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentDelivery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deliveryEventId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    CONSTRAINT "ContentDelivery_deliveryEventId_fkey" FOREIGN KEY ("deliveryEventId") REFERENCES "DeliveryEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkDelivery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deliveryEventId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "anchorText" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "domainAuthority" INTEGER NOT NULL,
    CONSTRAINT "LinkDelivery_deliveryEventId_fkey" FOREIGN KEY ("deliveryEventId") REFERENCES "DeliveryEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_clientId_idx" ON "AnalyticsSnapshot"("clientId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_date_idx" ON "AnalyticsSnapshot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSnapshot_clientId_date_key" ON "AnalyticsSnapshot"("clientId", "date");

-- CreateIndex
CREATE INDEX "DeliveryEvent_clientId_idx" ON "DeliveryEvent"("clientId");

-- CreateIndex
CREATE INDEX "DeliveryEvent_date_idx" ON "DeliveryEvent"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ContentDelivery_deliveryEventId_key" ON "ContentDelivery"("deliveryEventId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkDelivery_deliveryEventId_key" ON "LinkDelivery"("deliveryEventId");
