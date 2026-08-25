import prisma from "@/lib/db";
import { getDecryptedCredentials } from "./googleApiService";

// ─── Daily Metric Mapping ──────────────────────────────────────────
// We fetch:
// - BUSINESS_IMPRESSIONS_DESKTOP_MAPS
// - BUSINESS_IMPRESSIONS_DESKTOP_SEARCH
// - BUSINESS_IMPRESSIONS_MOBILE_MAPS
// - BUSINESS_IMPRESSIONS_MOBILE_SEARCH
// - WEBSITE_CLICKS
// - CALL_CLICKS
// - DIRECTION_REQUESTS
// - BUSINESS_CONVERSATIONS
// - BUSINESS_BOOKINGS

const GBP_METRICS_LIST = [
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "WEBSITE_CLICKS",
  "CALL_CLICKS",
  "DIRECTION_REQUESTS",
  "BUSINESS_CONVERSATIONS",
  "BUSINESS_BOOKINGS"
];

export async function syncGbpData(locationId: number, daysBack: number = 30): Promise<void> {
  const location = await prisma.gbpLocation.findUnique({
    where: { id: locationId },
    include: { connection: true }
  });

  if (!location) {
    throw new Error(`GbpLocation not found: ID ${locationId}`);
  }

  // Set syncing status
  await prisma.gbpLocation.update({
    where: { id: locationId },
    data: { syncStatus: "SYNCING" }
  });

  try {
    const { accessToken } = await getDecryptedCredentials(location.connectionId);
    if (!accessToken) {
      throw new Error("No Google access token available for sync.");
    }

    // Determine date range (Google GMB has a 3-day data latency, let's pull up to today)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysBack);

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const startDay = startDate.getDate();

    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth() + 1;
    const endDay = endDate.getDate();

    // Construct URL with array parameters for dailyMetrics
    const url = new URL(`https://businessprofileperformance.googleapis.com/v1/${location.locationName}:fetchMultiDailyMetricsTimeSeries`);
    
    GBP_METRICS_LIST.forEach((m) => url.searchParams.append("dailyMetrics", m));
    
    url.searchParams.set("daily_range.start_date.year", startYear.toString());
    url.searchParams.set("daily_range.start_date.month", startMonth.toString());
    url.searchParams.set("daily_range.start_date.day", startDay.toString());
    
    url.searchParams.set("daily_range.end_date.year", endYear.toString());
    url.searchParams.set("daily_range.end_date.month", endMonth.toString());
    url.searchParams.set("daily_range.end_date.day", endDay.toString());

    console.log(`[GBP SYNC] Fetching GMB performance for Location ID ${locationId} (${location.locationName}). URL: ${url.pathname}${url.search}`);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google API returned status ${response.status}: ${errText}`);
    }

    const resJson = await response.json();
    const metricSeriesList = resJson.multiDailyMetricTimeSeries || [];

    // Parse GMB Daily time series data into a structured Map: Date ISO String -> Snapshot details
    // Because daily metrics are returned as separate time series, we consolidate values for each date.
    const dateMap = new Map<string, {
      viewsSearch: number;
      viewsMaps: number;
      clicksWebsite: number;
      clicksCall: number;
      clicksDirections: number;
      messages: number;
      bookings: number;
    }>();

    for (const series of metricSeriesList) {
      const metricName = series.dailyMetric;
      const datedValues = series.timeSeries?.datedValues || [];

      for (const entry of datedValues) {
        const d = entry.date;
        if (!d || d.year === undefined || d.month === undefined || d.day === undefined) continue;

        // Construct standardized date string (YYYY-MM-DD)
        const dateStr = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
        const val = parseInt(entry.value || "0", 10);

        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, {
            viewsSearch: 0,
            viewsMaps: 0,
            clicksWebsite: 0,
            clicksCall: 0,
            clicksDirections: 0,
            messages: 0,
            bookings: 0
          });
        }

        const metricsObj = dateMap.get(dateStr)!;

        // Map GMB API metric name to our snapshot fields
        if (metricName.includes("IMPRESSIONS_DESKTOP_SEARCH") || metricName.includes("IMPRESSIONS_MOBILE_SEARCH")) {
          metricsObj.viewsSearch += val;
        } else if (metricName.includes("IMPRESSIONS_DESKTOP_MAPS") || metricName.includes("IMPRESSIONS_MOBILE_MAPS")) {
          metricsObj.viewsMaps += val;
        } else if (metricName === "WEBSITE_CLICKS") {
          metricsObj.clicksWebsite += val;
        } else if (metricName === "CALL_CLICKS") {
          metricsObj.clicksCall += val;
        } else if (metricName === "DIRECTION_REQUESTS") {
          metricsObj.clicksDirections += val;
        } else if (metricName === "BUSINESS_CONVERSATIONS") {
          metricsObj.messages += val;
        } else if (metricName === "BUSINESS_BOOKINGS") {
          metricsObj.bookings += val;
        }
      }
    }

    // Write snapshots to database
    console.log(`[GBP SYNC] Storing GMB performance metrics in database. Records parsed: ${dateMap.size}`);

    await prisma.$transaction(async (tx) => {
      for (const [dateStr, metrics] of dateMap.entries()) {
        const dateObj = new Date(dateStr + "T00:00:00.000Z");

        await tx.gbpPerformanceSnapshot.upsert({
          where: {
            locationId_date: {
              locationId,
              date: dateObj
            }
          },
          update: {
            viewsSearch: metrics.viewsSearch,
            viewsMaps: metrics.viewsMaps,
            clicksWebsite: metrics.clicksWebsite,
            clicksCall: metrics.clicksCall,
            clicksDirections: metrics.clicksDirections,
            messages: metrics.messages,
            bookings: metrics.bookings
          },
          create: {
            locationId,
            date: dateObj,
            viewsSearch: metrics.viewsSearch,
            viewsMaps: metrics.viewsMaps,
            clicksWebsite: metrics.clicksWebsite,
            clicksCall: metrics.clicksCall,
            clicksDirections: metrics.clicksDirections,
            messages: metrics.messages,
            bookings: metrics.bookings
          }
        });
      }
    });

    // Mark location sync status as CONNECTED success
    await prisma.gbpLocation.update({
      where: { id: locationId },
      data: {
        syncStatus: "CONNECTED",
        syncError: null,
        lastSyncTime: new Date()
      }
    });

    console.log(`[GBP SYNC] Finished GMB performance sync for Location ID ${locationId}`);
  } catch (err: any) {
    console.error(`[GBP SYNC] Failed GMB performance sync for Location ID ${locationId}:`, err);
    await prisma.gbpLocation.update({
      where: { id: locationId },
      data: {
        syncStatus: "ERROR",
        syncError: err.message || "Failed during Google GMB sync"
      }
    });
  }
}
