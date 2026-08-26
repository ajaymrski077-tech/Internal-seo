export interface IntegrationConnectionRecord {
  id: number;
  propertyId: number | string;
  provider: "GA4" | "GSC" | "GBP" | string;
  externalId?: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "PAUSED" | "SYNC_ERROR" | string;
  syncStatus?: string | null;
  syncError?: string | null;
  lastSyncTime?: Date | null;
}

export interface TrackedKeywordRecord {
  id: number | string;
  propertyId: number | string;
  clientId: number | string;
  keyword: string;
  normalizedKeyword: string;
  targetUrl?: string | null;
  status: string;
}

export interface KeywordRankingSnapshotRecord {
  id: number | string;
  trackedKeywordId: number | string;
  date: Date;
  position: number | null;
  clicks: number;
  impressions: number;
  ctr: number;
}
