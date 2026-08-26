"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Filter, TrendingUp, AlertCircle, X, ChevronRight, Check, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2, Award, Settings, Tag, Trash2 } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";
import modalStyles from "@/styles/ClientModal.module.css";

interface TrackedKeyword {
  id: number;
  keyword: string;
  normalizedKeyword: string;
  clientId: number;
  client: { name: string };
  propertyId: number;
  property: { domain: string };
  status: string;
  tags: string;
  targetUrl: string | null;
  currentPosition: number | null;
  previousPosition: number | null;
  positionChange: number | null;
  clicks: number;
  impressions: number;
  ctr: number;
  updatedAt: string;
}

interface OverviewStats {
  totalTracked: number;
  activeKeywordsCount: number;
  averagePosition: number;
  top3Count: number;
  top10Count: number;
  top20Count: number;
  improvedCount: number;
  declinedCount: number;
  winnersList: Array<{ keyword: string; client: string; oldPos: number; newPos: number; change: number }>;
  losersList: Array<{ keyword: string; client: string; oldPos: number; newPos: number; change: number }>;
  strikingDistance: Array<{ id: number; keyword: string; client: string; domain: string; position: number; impressions: number; ctr: number; opportunityScore: number }>;
  highImpLowCtr: Array<{ id: number; keyword: string; client: string; position: number; impressions: number; ctr: number }>;
  positionGroups: { top3: number; top10: number; top20: number; top50: number; top100: number; missing: number };
}

interface DiscoveredKeyword {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  prevClicks: number;
  prevImpressions: number;
  prevCtr: number;
  prevPosition: number;
  clicksChange: number;
  impressionsChange: number;
  positionChange: number;
  isTracked: boolean;
}

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState("tracked"); // tracked, discover, striking, insights
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("All");
  const [propertyFilter, setPropertyFilter] = useState("All");
  const [daysRange, setDaysRange] = useState("30");
  const [groupFilter, setGroupFilter] = useState("All");

  const [trackedKeywords, setTrackedKeywords] = useState<TrackedKeyword[]>([]);
  const [discoveredKeywords, setDiscoveredKeywords] = useState<DiscoveredKeyword[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  
  const [clientsList, setClientsList] = useState<Array<{ id: number; name: string; properties: Array<{ id: number; domain: string }> }>>([]);
  const [propertiesList, setPropertiesList] = useState<Array<{ id: number; domain: string }>>([]);
  
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Add Custom Keyword modal fields
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formKeyword, setFormKeyword] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formTargetUrl, setFormTargetUrl] = useState("");
  const [formTags, setFormTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients?archived=ACTIVE_ONLY");
      if (res.ok) {
        const data = await res.json();
        setClientsList(data.clients || []);
      }
    } catch (err) {
      console.error("Failed to load clients list", err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Update properties list when client filter changes
  useEffect(() => {
    if (clientFilter === "All") {
      const allProps = clientsList.flatMap(c => c.properties || []);
      setPropertiesList(allProps);
      setPropertyFilter("All");
    } else {
      const client = clientsList.find(c => c.id === parseInt(clientFilter, 10));
      setPropertiesList(client?.properties || []);
      setPropertyFilter("All");
    }
    setPage(1);
  }, [clientFilter, clientsList]);

  const fetchOverview = async () => {
    try {
      const params = new URLSearchParams();
      if (clientFilter !== "All") params.set("clientId", clientFilter);
      if (propertyFilter !== "All") params.set("propertyId", propertyFilter);
      params.set("days", daysRange);

      const res = await fetch(`/api/rankings/overview?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (err) {
      console.error("Failed to fetch rankings overview stats", err);
    }
  };

  const fetchTrackedKeywords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (clientFilter !== "All") params.set("clientId", clientFilter);
      if (propertyFilter !== "All") params.set("propertyId", propertyFilter);
      if (groupFilter !== "All") params.set("positionGroup", groupFilter);
      if (search.trim()) params.set("search", search);
      params.set("page", page.toString());
      params.set("limit", "25");

      const res = await fetch(`/api/rankings/keywords?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTrackedKeywords(data.keywords || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to load tracked keywords", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscoveredKeywords = async () => {
    if (propertyFilter === "All") {
      setDiscoveredKeywords([]);
      return;
    }
    setDiscovering(true);
    try {
      const res = await fetch(`/api/rankings/discover?propertyId=${propertyFilter}&days=${daysRange}`);
      if (res.ok) {
        const data = await res.json();
        setDiscoveredKeywords(data.keywords || []);
      } else {
        setDiscoveredKeywords([]);
      }
    } catch (err) {
      console.error("Failed to discover keywords from GSC", err);
      setDiscoveredKeywords([]);
    } finally {
      setDiscovering(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    if (activeTab === "tracked") {
      fetchTrackedKeywords();
    } else if (activeTab === "discover") {
      fetchDiscoveredKeywords();
    }
  }, [clientFilter, propertyFilter, daysRange, groupFilter, search, activeTab, page]);

  const handleTrackKeyword = async (q: string) => {
    if (propertyFilter === "All") return;
    const client = clientsList.find(c => c.properties.some(p => p.id === parseInt(propertyFilter, 10)));
    if (!client) return;

    try {
      const res = await fetch("/api/rankings/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: q,
          clientId: client.id,
          propertyId: parseInt(propertyFilter, 10),
        })
      });

      if (res.ok) {
        // Update discovery item tracking status locally
        setDiscoveredKeywords(prev => prev.map(k => k.query === q ? { ...k, isTracked: true } : k));
        fetchOverview();
      }
    } catch (err) {
      console.error("Failed to track keyword", err);
    }
  };

  const handleAddKeywordModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKeyword.trim() || !formClientId || !formPropertyId) {
      setErrorMsg("Keyword, Client, and website Property are required.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/rankings/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: formKeyword,
          clientId: parseInt(formClientId, 10),
          propertyId: parseInt(formPropertyId, 10),
          targetUrl: formFormTargetUrlClean(formTargetUrl),
          tags: formTags,
        })
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || "Failed to track keyword.");
      }

      setIsAddModalOpen(false);
      setFormKeyword("");
      setFormTargetUrl("");
      setFormTags("");
      fetchTrackedKeywords();
      fetchOverview();
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMsg(errObj?.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const formFormTargetUrlClean = (url: string) => {
    if (!url.trim()) return null;
    return url.trim();
  };

  const handleUpdateKeywordStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/rankings/keywords/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchTrackedKeywords();
        fetchOverview();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDeleteKeyword = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to stop tracking this keyword?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/rankings/keywords/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTrackedKeywords();
        fetchOverview();
      }
    } catch (err) {
      console.error("Failed to delete keyword", err);
    }
  };

  const getPositionMovementSymbol = (change: number | null) => {
    if (change === null || change === undefined) return <span style={{ color: "#94A3B8" }}>—</span>;
    if (change > 0) return <span style={{ color: "#16A34A", display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: "700" }}><ArrowUpRight size={14} /> +{change}</span>;
    if (change < 0) return <span style={{ color: "#EF4444", display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: "700" }}><ArrowDownRight size={14} /> {change}</span>;
    return <span style={{ color: "#64748B" }}>—</span>;
  };

  return (
    <div className={styles.container} style={{ padding: "32px", maxWidth: "1500px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      
      {/* Top Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 className={styles.title} style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>Rankings Intelligence</h1>
          <p className={styles.subtitle} style={{ margin: "4px 0 0 0" }}>Analyze tracked keyword movements and discover striking distance opportunities from real GSC queries.</p>
        </div>
        <button 
          onClick={() => {
            setFormKeyword("");
            setFormClientId(clientsList[0]?.id.toString() || "");
            setFormPropertyId(clientsList[0]?.properties?.[0]?.id.toString() || "");
            setFormTargetUrl("");
            setFormTags("");
            setErrorMsg("");
            setIsAddModalOpen(true);
          }}
          style={{ padding: "8px 16px", background: "#0D9488", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={14} />
          Track Keyword
        </button>
      </div>

      {/* KPI Overview deck */}
      {overview && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          
          <div style={{ background: "white", padding: "16px 20px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>Tracked Keywords</span>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", marginTop: "4px" }}>{overview.totalTracked}</div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>{overview.activeKeywordsCount} with search data</div>
          </div>

          <div style={{ background: "white", padding: "16px 20px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>Average Position</span>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#0D9488", marginTop: "4px" }}>{overview.averagePosition || "—"}</div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>Active keywords average</div>
          </div>

          <div style={{ background: "white", padding: "16px 20px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>Top 3 Rankings</span>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", marginTop: "4px" }}>{overview.top3Count}</div>
            <div style={{ fontSize: "11px", color: "#16A34A", marginTop: "4px" }}>{overview.top10Count} in Top 10</div>
          </div>

          <div style={{ background: "white", padding: "16px 20px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>Ranking Improvements</span>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#16A34A", marginTop: "4px" }}>{overview.improvedCount}</div>
            <div style={{ fontSize: "11px", color: "#EF4444", marginTop: "4px" }}>{overview.declinedCount} declined positions</div>
          </div>

          <div style={{ background: "white", padding: "16px 20px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>Striking Distance</span>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#EA580C", marginTop: "4px" }}>{overview.strikingDistance.length}</div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>Positions between 4 and 20</div>
          </div>

        </div>
      )}

      {/* Primary filters */}
      <div style={{ background: "white", padding: "16px 24px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "24px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#64748B" }}>Client:</span>
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", background: "white", minWidth: "160px" }}>
            <option value="All">All Clients</option>
            {clientsList.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#64748B" }}>Website Property:</span>
          <select value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", background: "white", minWidth: "180px" }}>
            <option value="All">All Properties</option>
            {propertiesList.map(p => (
              <option key={p.id} value={p.id}>{p.domain}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#64748B" }}>Period:</span>
          <select value={daysRange} onChange={e => setDaysRange(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", background: "white" }}>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>

        {activeTab === "tracked" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "#64748B" }}>Group:</span>
            <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", background: "white" }}>
              <option value="All">All Groups</option>
              <option value="top3">Top 3 (positions 1–3)</option>
              <option value="top10">Top 10 (positions 1–10)</option>
              <option value="top20">Top 20 (positions 1–20)</option>
              <option value="strikingdistance">Striking Distance (positions 4–20)</option>
              <option value="improved">Improved positions</option>
              <option value="declined">Declined positions</option>
              <option value="highimpressions">High impressions (100+)</option>
              <option value="lowctr">High Imp / Low CTR (&lt;2%)</option>
            </select>
          </div>
        )}

        <button onClick={() => { setClientFilter("All"); setPropertyFilter("All"); setDaysRange("30"); setGroupFilter("All"); setSearch(""); }} style={{ padding: "6px 16px", background: "white", color: "#0F172A", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>Clear Filters</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E2E8F0", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("tracked")} style={{ padding: "10px 20px", background: "none", border: "none", borderBottom: activeTab === "tracked" ? "2px solid #0D9488" : "2px solid transparent", color: activeTab === "tracked" ? "#0D9488" : "#64748B", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>Tracked Database ({totalCount})</button>
        <button onClick={() => setActiveTab("discover")} style={{ padding: "10px 20px", background: "none", border: "none", borderBottom: activeTab === "discover" ? "2px solid #0D9488" : "2px solid transparent", color: activeTab === "discover" ? "#0D9488" : "#64748B", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>GSC Keyword Discovery</button>
        <button onClick={() => setActiveTab("striking")} style={{ padding: "10px 20px", background: "none", border: "none", borderBottom: activeTab === "striking" ? "2px solid #0D9488" : "2px solid transparent", color: activeTab === "striking" ? "#0D9488" : "#64748B", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>Striking Distance Insights</button>
      </div>

      {/* Tab content */}
      <div>
        
        {/* TAB 1: TRACKED DATABASE */}
        {activeTab === "tracked" && (
          <div>
            <div style={{ background: "white", padding: "16px 24px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Search size={16} style={{ color: "#94A3B8" }} />
              <input 
                type="text" 
                placeholder="Search tracked keywords..." 
                value={search} 
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ width: "100%", border: "none", outline: "none", fontSize: "13px" }}
              />
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px", background: "white", borderRadius: "8px" }}><div className="spinner" /></div>
            ) : trackedKeywords.length === 0 ? (
              <div className={styles.emptyState} style={{ background: "white", padding: "60px", textAlign: "center" }}>
                <TrendingUp className={styles.emptyIcon} style={{ fontSize: "48px", color: "#94A3B8", marginBottom: "16px" }} />
                <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>No Tracked Keywords</h2>
                <p style={{ color: "#64748B", margin: "8px 0 16px 0" }}>Start tracking keywords by adding custom ones or discovering them via GSC.</p>
              </div>
            ) : (
              <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      <th style={{ padding: "14px 24px", fontWeight: "600" }}>Keyword Query</th>
                      <th style={{ padding: "14px 24px", fontWeight: "600" }}>Client / Website</th>
                      <th style={{ padding: "14px 24px", fontWeight: "600" }}>Current Pos</th>
                      <th style={{ padding: "14px 24px", fontWeight: "600" }}>Previous Pos</th>
                      <th style={{ padding: "14px 24px", fontWeight: "600" }}>Movement</th>
                      <th style={{ padding: "14px 24px", fontWeight: "600" }}>Clicks</th>
                      <th style={{ padding: "14px 24px", fontWeight: "600" }}>Impressions</th>
                      <th style={{ padding: "14px 24px", fontWeight: "600" }}>CTR</th>
                      <th style={{ padding: "14px 24px", fontWeight: "600" }}>Status</th>
                      <th style={{ padding: "14px 24px", fontWeight: "600" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackedKeywords.map(kw => (
                      <tr key={kw.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "16px 24px", color: "#0F172A", fontWeight: "600" }}>
                          <Link href={`/admin/rankings/${kw.id}`} style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            {kw.keyword}
                            <ChevronRight size={12} style={{ color: "#94A3B8" }} />
                          </Link>
                          {kw.tags && (
                            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                              {kw.tags.split(",").map(t => (
                                <span key={t} style={{ background: "#F1F5F9", color: "#64748B", padding: "1px 6px", borderRadius: "4px", fontSize: "10px" }}>{t.trim()}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "16px 24px", color: "#475569" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span>{kw.client?.name}</span>
                            <span style={{ fontSize: "11px", color: "#94A3B8" }}>{kw.property?.domain}</span>
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", fontWeight: "600", color: "#0F172A" }}>{kw.currentPosition || "—"}</td>
                        <td style={{ padding: "16px 24px", color: "#64748B" }}>{kw.previousPosition || "—"}</td>
                        <td style={{ padding: "16px 24px" }}>{getPositionMovementSymbol(kw.positionChange)}</td>
                        <td style={{ padding: "16px 24px", color: "#475569" }}>{kw.clicks}</td>
                        <td style={{ padding: "16px 24px", color: "#475569" }}>{kw.impressions}</td>
                        <td style={{ padding: "16px 24px", color: "#475569" }}>{kw.ctr.toFixed(1)}%</td>
                        <td style={{ padding: "16px 24px" }}>
                          <select 
                            value={kw.status} 
                            onChange={e => handleUpdateKeywordStatus(kw.id, e.target.value)}
                            style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: "4px", fontSize: "12px", background: "white" }}
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="PAUSED">Paused</option>
                            <option value="ARCHIVED">Archived</option>
                          </select>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <button 
                            onClick={() => handleDeleteKeyword(kw.id)}
                            style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination footer */}
                {totalPages > 1 && (
                  <div style={{ padding: "16px 24px", background: "#F8FAFC", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: "13px", color: "#64748B" }}>Showing page {page} of {totalPages}</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} style={{ padding: "6px 12px", border: "1px solid #E2E8F0", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Previous</button>
                      <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages} style={{ padding: "6px 12px", border: "1px solid #E2E8F0", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GSC KEYWORD DISCOVERY */}
        {activeTab === "discover" && (
          <div>
            {propertyFilter === "All" ? (
              <div style={{ background: "white", border: "1px solid #E2E8F0", padding: "40px", borderRadius: "8px", textAlign: "center", color: "#64748B" }}>
                <AlertCircle size={32} style={{ color: "#EA580C", marginBottom: "12px" }} />
                <h3>Select a Website Property</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>To discover keyword queries, please select a specific website property from the filters above.</p>
              </div>
            ) : discovering ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px", background: "white", borderRadius: "8px" }}><div className="spinner" /></div>
            ) : discoveredKeywords.length === 0 ? (
              <div style={{ background: "white", border: "1px solid #E2E8F0", padding: "40px", borderRadius: "8px", textAlign: "center", color: "#64748B" }}>
                <TrendingUp size={32} style={{ color: "#94A3B8", marginBottom: "12px" }} />
                <h3>No Query Rows Returned</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>Google Search Console returned no search queries for this property in the selected range.</p>
              </div>
            ) : (
              <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      <th style={{ padding: "12px 24px", fontWeight: "600" }}>Query Keyword</th>
                      <th style={{ padding: "12px 24px", fontWeight: "600" }}>Average Position</th>
                      <th style={{ padding: "12px 24px", fontWeight: "600" }}>Clicks</th>
                      <th style={{ padding: "12px 24px", fontWeight: "600" }}>Impressions</th>
                      <th style={{ padding: "12px 24px", fontWeight: "600" }}>CTR</th>
                      <th style={{ padding: "12px 24px", fontWeight: "600" }}>Position Change</th>
                      <th style={{ padding: "12px 24px", fontWeight: "600" }}>Tracking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discoveredKeywords.map(kw => (
                      <tr key={kw.query} style={{ borderTop: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "12px 24px", fontWeight: "600", color: "#0F172A" }}>{kw.query}</td>
                        <td style={{ padding: "12px 24px", color: "#475569" }}>{kw.position}</td>
                        <td style={{ padding: "12px 24px", color: "#475569" }}>{kw.clicks}</td>
                        <td style={{ padding: "12px 24px", color: "#475569" }}>{kw.impressions}</td>
                        <td style={{ padding: "12px 24px", color: "#475569" }}>{kw.ctr.toFixed(1)}%</td>
                        <td style={{ padding: "12px 24px" }}>{getPositionMovementSymbol(kw.positionChange)}</td>
                        <td style={{ padding: "12px 24px" }}>
                          {kw.isTracked ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#16A34A", fontWeight: "600", fontSize: "12px" }}>
                              <Check size={14} />
                              Tracked
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleTrackKeyword(kw.query)}
                              style={{ padding: "4px 10px", background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#2563EB", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                            >
                              Track Query
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STRIKING DISTANCE INSIGHTS */}
        {activeTab === "striking" && (
          <div>
            {overview && overview.strikingDistance.length === 0 ? (
              <div style={{ background: "white", border: "1px solid #E2E8F0", padding: "40px", borderRadius: "8px", textAlign: "center", color: "#64748B" }}>
                <TrendingUp size={32} style={{ color: "#94A3B8", marginBottom: "12px" }} />
                <h3>No striking-distance opportunities detected</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>We couldn't locate any active tracked keywords ranking between positions 4 and 20.</p>
              </div>
            ) : overview && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                <div style={{ background: "white", padding: "20px 24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "600", color: "#0F172A" }}>Striking Distance Keywords</h3>
                  <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748B" }}>Tracked keywords ranking between 4 and 20, sorted by Opportunity Score. Formula: `impressions * (1 - CTR%)`.</p>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        <th style={{ padding: "12px 24px", fontWeight: "600" }}>Tracked Keyword</th>
                        <th style={{ padding: "12px 24px", fontWeight: "600" }}>Domain</th>
                        <th style={{ padding: "12px 24px", fontWeight: "600" }}>Position</th>
                        <th style={{ padding: "12px 24px", fontWeight: "600" }}>Impressions</th>
                        <th style={{ padding: "12px 24px", fontWeight: "600" }}>CTR</th>
                        <th style={{ padding: "12px 24px", fontWeight: "600" }}>Opportunity Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.strikingDistance.map(kw => (
                        <tr key={kw.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 24px", fontWeight: "600", color: "#0F172A" }}>
                            <Link href={`/admin/rankings/${kw.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                              {kw.keyword}
                            </Link>
                          </td>
                          <td style={{ padding: "12px 24px", color: "#64748B" }}>{kw.domain}</td>
                          <td style={{ padding: "12px 24px", color: "#EA580C", fontWeight: "600" }}>{kw.position}</td>
                          <td style={{ padding: "12px 24px", color: "#475569" }}>{kw.impressions}</td>
                          <td style={{ padding: "12px 24px", color: "#475569" }}>{kw.ctr.toFixed(1)}%</td>
                          <td style={{ padding: "12px 24px", color: "#0D9488", fontWeight: "700" }}>{kw.opportunityScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Add tracked keyword modal */}
      {isAddModalOpen && (
        <div className={modalStyles.overlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>Track New Keyword</span>
              <button onClick={() => setIsAddModalOpen(false)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddKeywordModalSubmit} className={modalStyles.body}>
              {errorMsg && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", padding: "12px", borderRadius: "6px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem" }}>
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Keyword Query Text</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={formKeyword}
                  onChange={(e) => setFormKeyword(e.target.value)}
                  placeholder="e.g. cloud accounting tools"
                  required
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Target Client</label>
                <select
                  className={modalStyles.input}
                  value={formClientId}
                  onChange={(e) => {
                    setFormClientId(e.target.value);
                    const selected = clientsList.find(c => c.id === parseInt(e.target.value, 10));
                    setFormPropertyId(selected?.properties?.[0]?.id.toString() || "");
                  }}
                  required
                >
                  <option value="">-- Select Client --</option>
                  {clientsList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Website Property</label>
                <select
                  className={modalStyles.input}
                  value={formPropertyId}
                  onChange={(e) => setFormPropertyId(e.target.value)}
                  required
                >
                  <option value="">-- Select Property --</option>
                  {(clientsList.find(c => c.id === parseInt(formClientId, 10))?.properties || []).map(p => (
                    <option key={p.id} value={p.id}>{p.domain}</option>
                  ))}
                </select>
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Target Landing Page URL (Optional)</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={formTargetUrl}
                  onChange={(e) => setFormTargetUrl(e.target.value)}
                  placeholder="e.g. https://client.com/pricing"
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Tracking Tags (comma separated)</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="e.g. core, blog, tier1"
                />
              </div>
            </form>
            <div className={modalStyles.footer} style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setIsAddModalOpen(false)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`} disabled={isSaving}>
                Cancel
              </button>
              <button onClick={handleAddKeywordModalSubmit} className={`${modalStyles.btn} ${modalStyles.btnSave}`} disabled={isSaving}>
                {isSaving ? "Tracking..." : "Track Keyword"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
