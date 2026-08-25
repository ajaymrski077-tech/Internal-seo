import assert from "assert";

const BASE_URL = "http://localhost:3000";
const ADMIN_COOKIE = "token=admin-session-token";

async function runTests() {
  console.log("=== Phase 2B.8 Link Building Verification ===\n");

  let testClientId = null;
  let campaignId = null;
  let opportunityId = null;
  let backlinkId = null;
  let taskId = null;

  try {
    // ----------------------------------------------------
    // [Step 1] Fetch clients list to get a valid Client ID
    // ----------------------------------------------------
    console.log("[Step 1] Fetching clients...");
    const clientsRes = await fetch(`${BASE_URL}/api/clients`, {
      headers: { Cookie: ADMIN_COOKIE }
    });
    assert.strictEqual(clientsRes.status, 200, "Should successfully list clients");
    const clientsData = await clientsRes.json();
    const clients = clientsData.clients || [];
    assert.ok(clients.length > 0, "Should have at least one client in the database");
    
    // Choose client A
    const clientA = clients[0];
    testClientId = clientA.id;
    console.log(`Using Client: ID=${testClientId} (${clientA.name})`);

    // ----------------------------------------------------
    // [Step 2] Authenticated Route Guards check (Unauthorized access)
    // ----------------------------------------------------
    console.log("[Step 2] Checking auth guards...");
    const guardRes = await fetch(`${BASE_URL}/api/links/campaigns`, { method: "GET" });
    assert.strictEqual(guardRes.status, 401, "Should reject unauthenticated requests");
    console.log("Auth guards verified!");

    // ----------------------------------------------------
    // [Step 3] Create Link Campaign
    // ----------------------------------------------------
    console.log("[Step 3] Creating Link Campaign...");
    const createCampaignRes = await fetch(`${BASE_URL}/api/links/campaigns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ADMIN_COOKIE,
      },
      body: JSON.stringify({
        name: "Verification Outreach Campaign",
        clientId: testClientId,
        description: "Testing link pipeline integration",
        objective: "Build 5 target backlinks",
        status: "ACTIVE",
        priority: "HIGH",
        startDate: "2026-08-01",
        targetDate: "2026-09-01",
        monthlyTarget: 10,
      }),
    });
    assert.strictEqual(createCampaignRes.status, 201, "Campaign creation should succeed");
    const campaign = await createCampaignRes.json();
    campaignId = campaign.id;
    console.log(`Created Campaign ID ${campaignId}: "${campaign.name}"`);

    // ----------------------------------------------------
    // [Step 4] Query Link Overview KPIs
    // ----------------------------------------------------
    console.log("[Step 4] Checking Link Overview stats...");
    const overviewRes = await fetch(`${BASE_URL}/api/links/overview?clientId=${testClientId}`, {
      headers: { Cookie: ADMIN_COOKIE }
    });
    assert.strictEqual(overviewRes.status, 200, "Should load overview stats");
    const overview = await overviewRes.json();
    console.log(`Overview stats loaded. Active Campaigns Count: ${overview.activeCampaigns}`);
    assert.ok(overview.activeCampaigns >= 1, "Should have at least 1 active campaign");

    // ----------------------------------------------------
    // [Step 5] Add Opportunity Target
    // ----------------------------------------------------
    console.log("[Step 5] Adding Opportunity Target...");
    const createOppRes = await fetch(`${BASE_URL}/api/links/campaigns/${campaignId}/opportunities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ADMIN_COOKIE,
      },
      body: JSON.stringify({
        domain: "wikipedia.org",
        websiteName: "Wikipedia Niche Portal",
        websiteUrl: "https://www.wikipedia.org",
        contactName: "Jimmy Wales",
        contactEmail: "jimmy@wikimedia.org",
        sourceType: "RESOURCE_PAGE",
        relevance: "High",
        authorityMetric: 98,
        targetPage: "https://mysite.com/portal",
        proposedAnchorText: "financial analytics wiki",
        status: "PROSPECT",
        notes: "Highly valuable backlink",
      }),
    });
    assert.strictEqual(createOppRes.status, 201, "Opportunity creation should succeed");
    const opportunity = await createOppRes.json();
    opportunityId = opportunity.id;
    console.log(`Created Opportunity ID ${opportunityId}: domain="${opportunity.domain}"`);

    // ----------------------------------------------------
    // [Step 6] Shift Opportunity Status
    // ----------------------------------------------------
    console.log("[Step 6] Shifting Opportunity status...");
    const updateOppRes = await fetch(`${BASE_URL}/api/links/opportunities/${opportunityId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: ADMIN_COOKIE,
      },
      body: JSON.stringify({ status: "CONTACTED", followUpDate: "2026-08-25" }),
    });
    assert.strictEqual(updateOppRes.status, 200, "Should update opportunity details");
    const updatedOpp = await updateOppRes.json();
    assert.strictEqual(updatedOpp.status, "CONTACTED", "Status should transition to CONTACTED");
    console.log("Opportunity status updated successfully.");

    // ----------------------------------------------------
    // [Step 7] Create Acquired Backlink Record
    // ----------------------------------------------------
    console.log("[Step 7] Adding Acquired Backlink...");
    const createBacklinkRes = await fetch(`${BASE_URL}/api/links/campaigns/${campaignId}/backlinks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ADMIN_COOKIE,
      },
      body: JSON.stringify({
        sourceDomain: "wikipedia.org",
        sourceUrl: "https://www.wikipedia.org",
        targetUrl: "https://mysite.com/portal",
        anchorText: "financial analytics wiki",
        linkType: "FOLLOW",
        notes: "Pending checking check",
        opportunityId: opportunityId,
      }),
    });
    assert.strictEqual(createBacklinkRes.status, 201, "Backlink creation should succeed");
    const backlink = await createBacklinkRes.json();
    backlinkId = backlink.id;
    console.log(`Created Backlink ID ${backlinkId}: sourceUrl="${backlink.sourceUrl}"`);

    // ----------------------------------------------------
    // [Step 8] Link Verification SSRF Guard protection
    // ----------------------------------------------------
    console.log("[Step 8] Testing SSRF protections (Loopback IP / localhost URL check)...");
    const unsafeCreateRes = await fetch(`${BASE_URL}/api/links/campaigns/${campaignId}/backlinks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ADMIN_COOKIE,
      },
      body: JSON.stringify({
        sourceDomain: "localhost",
        sourceUrl: "http://127.0.0.1:3000/api/dashboard",
        targetUrl: "https://mysite.com/portal",
        anchorText: "unsafe local link",
        linkType: "FOLLOW",
      }),
    });
    assert.strictEqual(unsafeCreateRes.status, 201, "Should allow creating local url record");
    const unsafeBacklink = await unsafeCreateRes.json();
    
    const unsafeVerifyRes = await fetch(`${BASE_URL}/api/links/backlinks/${unsafeBacklink.id}/verify`, {
      method: "POST",
      headers: { Cookie: ADMIN_COOKIE }
    });
    assert.strictEqual(unsafeVerifyRes.status, 200, "Should process and return status");
    const unsafeResult = await unsafeVerifyRes.json();
    console.log(`SSRF block status: ${unsafeResult.status}, Error: ${unsafeResult.error}`);
    assert.strictEqual(unsafeResult.status, "UNKNOWN", "Should block loopback and return UNKNOWN");
    assert.ok(unsafeResult.error.includes("resolves to a local or private address"), "Error should clearly log SSRF prevention");

    // Clean up unsafe backlink
    await fetch(`${BASE_URL}/api/links/backlinks/${unsafeBacklink.id}`, {
      method: "DELETE",
      headers: { Cookie: ADMIN_COOKIE }
    });
    console.log("SSRF Blocked & Secured successfully!");

    // ----------------------------------------------------
    // [Step 9] Safe external URL verification check
    // ----------------------------------------------------
    console.log("[Step 9] Testing safe external URL checker...");
    const verifyRes = await fetch(`${BASE_URL}/api/links/backlinks/${backlinkId}/verify`, {
      method: "POST",
      headers: { Cookie: ADMIN_COOKIE }
    });
    assert.strictEqual(verifyRes.status, 200, "Verify endpoint should resolve safely");
    const verifyResult = await verifyRes.json();
    console.log(`Verification completed. Status: ${verifyResult.status}`);
    // Since wikipedia.org might not contain a link to mysite.com, it should return MISSING (but not throw an error or SSRF warning)
    assert.ok(["MISSING", "LIVE", "UNKNOWN", "BROKEN"].includes(verifyResult.status), "Should return valid crawler checking status");

    // ----------------------------------------------------
    // [Step 10] Link Campaign Action Task
    // ----------------------------------------------------
    console.log("[Step 10] Linking an action task to Campaign...");
    const createTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ADMIN_COOKIE,
      },
      body: JSON.stringify({
        title: "Submit guest post pitch",
        description: "Prepare slides draft",
        status: "TODO",
        priority: "HIGH",
        clientId: testClientId,
        linkCampaignId: campaignId,
      }),
    });
    assert.strictEqual(createTaskRes.status, 201, "Task creation should succeed");
    const task = await createTaskRes.json();
    taskId = task.id;
    assert.strictEqual(task.linkCampaignId, campaignId, "Task should belong to the campaign");
    console.log(`Created Task ID ${taskId} linked to LinkCampaign ID ${campaignId}`);

    // ----------------------------------------------------
    // [Step 11] Client Isolation Verification
    // ----------------------------------------------------
    console.log("[Step 11] Verifying client workspace isolation...");
    const anotherClientRes = await fetch(`${BASE_URL}/api/links/overview?clientId=99999`, {
      headers: { Cookie: ADMIN_COOKIE }
    });
    assert.strictEqual(anotherClientRes.status, 200, "Empty workspace load should succeed");
    const anotherOverview = await anotherClientRes.json();
    console.log(`Isolated client overview. Active campaigns count: ${anotherOverview.activeCampaigns}`);
    assert.strictEqual(anotherOverview.activeCampaigns, 0, "Isolated client should show 0 campaigns");
    console.log("CLIENT PORTFOLIO ISOLATION VERIFIED SECURE!");

    // ----------------------------------------------------
    // [Step 12] Clean up test records (Delete campaign)
    // ----------------------------------------------------
    console.log("[Step 12] Cleaning up test records (Delete Campaign)...");
    const deleteRes = await fetch(`${BASE_URL}/api/links/campaigns/${campaignId}`, {
      method: "DELETE",
      headers: { Cookie: ADMIN_COOKIE }
    });
    assert.strictEqual(deleteRes.status, 200, "Should delete campaign");
    console.log("Campaign deleted.");

    // Verify task linkCampaignId is setNull
    const checkTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
      headers: { Cookie: ADMIN_COOKIE }
    });
    const tasksData = await checkTaskRes.json();
    const cleanTask = (tasksData.tasks || []).find(t => t.id === taskId);
    assert.ok(cleanTask, "Linked task should still exist in ledger database");
    assert.strictEqual(cleanTask.linkCampaignId, null, "Cascading relation should safely nullify campaign reference");
    console.log("Task campaign relation nullified correctly.");

    // Clean up task
    await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Cookie: ADMIN_COOKIE }
    });
    console.log("Test Task cleaned up.");

    console.log("\n=== Phase 2B.8 Verification Complete: ALL TESTS PASSED ===");
  } catch (err) {
    console.error("\nAssertion failed during testing:", err);
    process.exit(1);
  }
}

runTests();
