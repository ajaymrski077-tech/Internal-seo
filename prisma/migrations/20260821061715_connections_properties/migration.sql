/*
  Warnings:

  - You are about to drop the column `clientId` on the `AnalyticsSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `domain` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `initials` on the `Client` table. All the data in the column will be lost.
  - Added the required column `propertyId` to the `AnalyticsSnapshot` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "WebsiteProperty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WebsiteProperty_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "syncStatus" TEXT,
    "syncError" TEXT,
    "lastSyncTime" DATETIME,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" DATETIME,
    "externalId" TEXT,
    "conversionEventName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IntegrationConnection_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "WebsiteProperty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AnalyticsSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "sessions" INTEGER NOT NULL,
    "organicTraffic" INTEGER NOT NULL,
    "conversions" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsSnapshot_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "WebsiteProperty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AnalyticsSnapshot" ("conversions", "createdAt", "date", "id", "organicTraffic", "sessions") SELECT "conversions", "createdAt", "date", "id", "organicTraffic", "sessions" FROM "AnalyticsSnapshot";
DROP TABLE "AnalyticsSnapshot";
ALTER TABLE "new_AnalyticsSnapshot" RENAME TO "AnalyticsSnapshot";
CREATE INDEX "AnalyticsSnapshot_propertyId_idx" ON "AnalyticsSnapshot"("propertyId");
CREATE INDEX "AnalyticsSnapshot_date_idx" ON "AnalyticsSnapshot"("date");
CREATE UNIQUE INDEX "AnalyticsSnapshot_propertyId_date_key" ON "AnalyticsSnapshot"("propertyId", "date");
CREATE TABLE "new_Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Client" ("createdAt", "id", "isArchived", "logoUrl", "name", "status", "updatedAt") SELECT "createdAt", "id", "isArchived", "logoUrl", "name", "status", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE TABLE "new_DeliveryEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "propertyId" INTEGER,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryEvent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "WebsiteProperty" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DeliveryEvent" ("clientId", "createdAt", "date", "description", "id", "type") SELECT "clientId", "createdAt", "date", "description", "id", "type" FROM "DeliveryEvent";
DROP TABLE "DeliveryEvent";
ALTER TABLE "new_DeliveryEvent" RENAME TO "DeliveryEvent";
CREATE INDEX "DeliveryEvent_clientId_idx" ON "DeliveryEvent"("clientId");
CREATE INDEX "DeliveryEvent_propertyId_idx" ON "DeliveryEvent"("propertyId");
CREATE INDEX "DeliveryEvent_date_idx" ON "DeliveryEvent"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "IntegrationConnection_propertyId_idx" ON "IntegrationConnection"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_propertyId_provider_key" ON "IntegrationConnection"("propertyId", "provider");
