import { google } from "googleapis";
import prisma from "@/lib/db";
import { encryptToken, decryptToken } from "./tokenEncryptionService";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const getGoogleAuthUrl = (state: string, scopes: string[]) => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state,
    prompt: "consent", // Force consent to ensure we get a refresh token
  });
};

export const getGoogleTokens = async (code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

/**
 * Helper to fetch, decrypt, and auto-refresh credentials for a connection.
 * Detects legacy plaintext credentials, encrypts them, and saves them back to the database.
 * If the access token is expired, it refreshes it synchronously and stores the refreshed credentials.
 */
export const getDecryptedCredentials = async (connectionId: string | number) => {
  const conn = await prisma.integrationConnection.findUnique({
    where: { id: connectionId.toString() }
  });
  if (!conn) throw new Error("Connection not found");

  let accessToken = conn.accessToken || "";
  let refreshToken = conn.refreshToken || "";
  let tokenExpiry = conn.tokenExpiry;
  let needsUpdate = false;

  // 1. Decrypt access token (handling fallback)
  if (accessToken && !accessToken.startsWith("enc:")) {
    accessToken = decryptToken(accessToken);
    needsUpdate = true;
  } else if (accessToken) {
    accessToken = decryptToken(accessToken);
  }

  // 2. Decrypt refresh token (handling fallback)
  if (refreshToken && !refreshToken.startsWith("enc:")) {
    refreshToken = decryptToken(refreshToken);
    needsUpdate = true;
  } else if (refreshToken) {
    refreshToken = decryptToken(refreshToken);
  }

  // 3. Auto-refresh if expired
  const now = new Date();
  const isExpired = tokenExpiry && tokenExpiry.getTime() < now.getTime();
  if (isExpired && refreshToken) {
    try {
      console.log(`[AUTH] Credentials expired for connection ${connectionId}. Refreshing token...`);
      const tempOauthClient = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      tempOauthClient.setCredentials({ refresh_token: refreshToken });
      
      const { credentials } = await tempOauthClient.refreshAccessToken();
      if (credentials.access_token) {
        accessToken = credentials.access_token;
        tokenExpiry = credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600 * 1000);
        needsUpdate = true;
      }
      if (credentials.refresh_token) {
        refreshToken = credentials.refresh_token;
        needsUpdate = true;
      }
    } catch (err: unknown) {
      console.error(`[AUTH] Failed to refresh tokens for connection ${connectionId}:`, err);
    }
  }

  // 4. Persist encrypted/updated credentials if changed
  if (needsUpdate) {
    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        accessToken: accessToken ? encryptToken(accessToken) : null,
        refreshToken: refreshToken ? encryptToken(refreshToken) : null,
        tokenExpiry: tokenExpiry,
      }
    });
    console.log(`[AUTH] Migrated/Updated encrypted credentials for connection ${connectionId}`);
  }

  return { accessToken, refreshToken, tokenExpiry };
};

/**
 * Setup backup auto-refresh listener on clients.
 */
const setupRefreshListener = (client: InstanceType<typeof google.auth.OAuth2>, connectionId: string | number) => {
  client.on("tokens", async (tokens) => {
    try {
      const updateData: { accessToken?: string; refreshToken?: string; tokenExpiry?: Date; lastSyncTime?: Date } = {};
      if (tokens.access_token) {
        updateData.accessToken = encryptToken(tokens.access_token);
      }
      if (tokens.refresh_token) {
        updateData.refreshToken = encryptToken(tokens.refresh_token);
      }
      if (tokens.expiry_date) {
        updateData.tokenExpiry = new Date(tokens.expiry_date);
      }

      if (Object.keys(updateData).length > 0) {
        updateData.lastSyncTime = new Date();
        await prisma.integrationConnection.update({
          where: { id: connectionId.toString() },
          data: updateData
        });
        console.log(`[AUTH] Event-driven writeback: saved refreshed credentials for connection ${connectionId}`);
      }
    } catch (err: unknown) {
      console.error(`[AUTH] Failed to save credentials refreshed by event:`, err);
    }
  });
};

export const getGa4Client = (connectionId: string | number, accessToken: string, refreshToken?: string) => {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  
  setupRefreshListener(client, connectionId);

  return google.analyticsdata({ version: "v1beta", auth: client });
};

export const getGa4AdminClient = (connectionId: string | number, accessToken: string, refreshToken?: string) => {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  setupRefreshListener(client, connectionId);

  return google.analyticsadmin({ version: "v1beta", auth: client });
};

export const getGscClient = (connectionId: string | number, accessToken: string, refreshToken?: string) => {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  setupRefreshListener(client, connectionId);

  return google.webmasters({ version: "v3", auth: client });
};

export const listGa4Properties = async (connectionId: string | number) => {
  const { accessToken, refreshToken } = await getDecryptedCredentials(connectionId);
  if (!accessToken) throw new Error("No access token available.");
  
  const adminClient = getGa4AdminClient(connectionId, accessToken, refreshToken || undefined);
  const response = await adminClient.accountSummaries.list({
    pageSize: 200,
  });
  
  const summaries = response.data.accountSummaries || [];
  const propertiesList: Array<{ propertyId: string; displayName: string; accountName: string }> = [];
  
  for (const accountSummary of summaries) {
    const accountName = accountSummary.displayName || accountSummary.account || "Unknown Account";
    const propertySummaries = accountSummary.propertySummaries || [];
    for (const propSummary of propertySummaries) {
      if (propSummary.property) {
        const propertyId = propSummary.property.replace("properties/", "");
        propertiesList.push({
          propertyId,
          displayName: propSummary.displayName || propertyId,
          accountName,
        });
      }
    }
  }
  
  return propertiesList;
};

export const listGscSites = async (connectionId: string | number) => {
  const { accessToken, refreshToken } = await getDecryptedCredentials(connectionId);
  if (!accessToken) throw new Error("No access token available.");
  
  const gscClient = getGscClient(connectionId, accessToken, refreshToken || undefined);
  const response = await gscClient.sites.list({});
  const siteEntry = response.data.siteEntry || [];
  
  return siteEntry.map((site) => ({
    siteUrl: site.siteUrl || "",
    permissionLevel: site.permissionLevel || "",
  }));
};
