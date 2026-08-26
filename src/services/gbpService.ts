import { getDecryptedCredentials } from "./googleApiService";

// ─── Interfaces ────────────────────────────────────────────────────

export interface GbpAccount {
  name: string; // e.g. accounts/12345
  accountName: string; // Display name
  type: string; // PERSONAL, ORGANIZATION, etc.
}

export interface GbpLocationInfo {
  name: string; // e.g. locations/98765
  title: string; // Business name
  primaryCategory?: string;
  address?: string;
  phone?: string;
  websiteUri?: string;
}

// ─── List Accounts ─────────────────────────────────────────────────

export async function listGbpAccounts(connectionId: string | number): Promise<GbpAccount[]> {
  const { accessToken } = await getDecryptedCredentials(Number(connectionId));
  if (!accessToken) throw new Error("No Google access token available.");

  const response = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to list GMB accounts: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const accounts: Array<{ name: string; accountName?: string; type?: string }> = data.accounts || [];

  return accounts.map((acc) => ({
    name: acc.name,
    accountName: acc.accountName || "Unknown Account",
    type: acc.type || "PERSONAL",
  }));
}

// ─── List Locations ────────────────────────────────────────────────

export async function listGbpLocations(
  connectionId: string | number,
  accountName: string
): Promise<GbpLocationInfo[]> {
  const { accessToken } = await getDecryptedCredentials(Number(connectionId));
  if (!accessToken) throw new Error("No Google access token available.");

  // Encode the accountName parameter to fit in the path (e.g. accounts/123)
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,primaryCategory,websiteUri,phoneNumbers`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to list GMB locations: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const locations: Array<{
    name: string;
    title?: string;
    primaryCategory?: { displayName?: string };
    storefrontAddress?: { locality?: string; administrativeArea?: string; postalCode?: string; addressLines?: string[] };
    phoneNumbers?: { primaryPhone?: string };
    websiteUri?: string;
  }> = data.locations || [];

  return locations.map((loc) => {
    // Address formatter
    let address = "";
    if (loc.storefrontAddress) {
      const parts = [
        loc.storefrontAddress.locality,
        loc.storefrontAddress.administrativeArea,
        loc.storefrontAddress.postalCode,
      ].filter(Boolean);
      const lines = loc.storefrontAddress.addressLines || [];
      address = [...lines, parts.join(", ")].join(" ");
    }

    return {
      name: loc.name,
      title: loc.title || "Unnamed Location",
      primaryCategory: loc.primaryCategory?.displayName || undefined,
      address: address || undefined,
      phone: loc.phoneNumbers?.primaryPhone || undefined,
      websiteUri: loc.websiteUri || undefined,
    };
  });
}
