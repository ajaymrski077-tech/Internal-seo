"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  FileText, Lightbulb, Clipboard, PenTool, CheckSquare, Calendar, Globe, Plus, 
  RefreshCw, AlertTriangle, ChevronRight, Eye, MousePointerClick, MessageSquare, BookOpen, 
  Trash2, Send, CheckCircle, ArrowRight, User, ExternalLink 
} from "lucide-react";
import styles from "@/styles/SharedModule.module.css";

interface Property {
  id: number;
  domain: string;
  name: string;
  clientId: number;
}

interface ContentItem {
  id: number;
  title: string;
  targetKeyword: string;
  searchIntent: string | null;
  contentType: string | null;
  priority: string;
  source: string;
  status: string;
  publishDate: string | null;
  liveUrl: string | null;
  pubNotes: string | null;
  createdAt: string;
  brief: {
    primaryKeywords: string | null;
    secondaryKeywords: string | null;
    targetAudience: string | null;
    suggestedUrl: string | null;
    seoTitle: string | null;
    metaDescription: string | null;
    wordCountTarget: number | null;
    outline: string | null;
    internalLinking: string | null;
    writerNotes: string | null;
  } | null;
  draft: {
    body: string | null;
    reviewNotes: string | null;
  } | null;
}

interface Opportunity {
  id: string;
  title: string;
  targetKeyword: string;
  source: "GSC" | "RANKINGS" | "ONPAGE";
  metricSummary: string;
  suggestedAction: string;
}

export default function ContentWorkflowDashboard() {
  // Properties and Navigation
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "ideas" | "queue" | "drafts" | "library">("dashboard");
  const [loading, setLoading] = useState(true);

  // Dashboard Stats
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [recentPublish, setRecentPublish] = useState<any[]>([]);

  // Opportunities & Items
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(false);

  // Forms / Modals / Drawers State
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [newIdeaKeyword, setNewIdeaKeyword] = useState("");
  const [newIdeaIntent, setNewIdeaIntent] = useState("Informational");
  const [newIdeaType, setNewIdeaType] = useState("Blog Post");
  const [newIdeaPriority, setNewIdeaPriority] = useState("MEDIUM");

  // Selected Item for Drawer
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isBriefDrawerOpen, setIsBriefDrawerOpen] = useState(false);
  const [isDraftDrawerOpen, setIsDraftDrawerOpen] = useState(false);

  // Brief Edit States
  const [briefPrimary, setBriefPrimary] = useState("");
  const [briefSecondary, setBriefSecondary] = useState("");
  const [briefAudience, setBriefAudience] = useState("");
  const [briefSuggestedUrl, setBriefSuggestedUrl] = useState("");
  const [briefSeoTitle, setBriefSeoTitle] = useState("");
  const [briefMetaDesc, setBriefMetaDesc] = useState("");
  const [briefWordCount, setBriefWordCount] = useState("1000");
  const [briefOutline, setBriefOutline] = useState("");
  const [briefLinking, setBriefLinking] = useState("");
  const [briefNotes, setBriefNotes] = useState("");

  // Draft Edit States
  const [draftBody, setDraftBody] = useState("");
  const [draftReviewNotes, setDraftReviewNotes] = useState("");
  const [transitionStatusInput, setTransitionStatusInput] = useState("");
  const [pubLiveUrl, setPubLiveUrl] = useState("");
  const [pubNotes, setPubNotes] = useState("");

  // Initial load: Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch("/api/properties");
        if (res.ok) {
          const data = await res.json();
          const props = data.properties || [];
          setProperties(props);
          if (props.length > 0) {
            setSelectedPropertyId(props[0].id);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load properties:", err);
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!selectedPropertyId) return;
    try {
      const res = await fetch(`/api/content/dashboard?propertyId=${selectedPropertyId}`);
      if (res.ok) {
        const data = await res.json();
        setCounts(data.counts || {});
        setUpcoming(data.upcoming || []);
        setRecentPublish(data.recentPublish || []);
      }
    } catch (err) {
      console.error("Error loading content dashboard:", err);
    }
  }, [selectedPropertyId]);

  const loadItems = useCallback(async () => {
    if (!selectedPropertyId) return;
    try {
      const res = await fetch(`/api/content/items?propertyId=${selectedPropertyId}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Error loading content items:", err);
    }
  }, [selectedPropertyId]);

  const loadOpportunities = useCallback(async () => {
    if (!selectedPropertyId) return;
    setLoadingOpps(true);
    try {
      const res = await fetch(`/api/content/opportunities?propertyId=${selectedPropertyId}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.error("Error loading opportunities:", err);
    } finally {
      setLoadingOpps(false);
    }
  }, [selectedPropertyId]);

  // Load active tab data
  useEffect(() => {
    if (!selectedPropertyId) return;
    const reload = async () => {
      setLoading(true);
      if (activeTab === "dashboard") {
        await loadDashboardData();
      } else if (activeTab === "ideas") {
        await Promise.all([loadItems(), loadOpportunities()]);
      } else {
        await loadItems();
      }
      setLoading(false);
    };
    reload();
  }, [selectedPropertyId, activeTab, loadDashboardData, loadItems, loadOpportunities]);

  // ─── Actions handlers ──────────────────────────────────────────────

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId || !newIdeaTitle || !newIdeaKeyword) return;

    try {
      const res = await fetch("/api/content/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          title: newIdeaTitle,
          targetKeyword: newIdeaKeyword,
          searchIntent: newIdeaIntent,
          contentType: newIdeaType,
          priority: newIdeaPriority,
          source: "MANUAL",
          status: "IDEA"
        })
      });
      if (res.ok) {
        setIsIdeaModalOpen(false);
        setNewIdeaTitle("");
        setNewIdeaKeyword("");
        loadItems();
      }
    } catch (err) {
      console.error("Failed to create idea:", err);
    }
  };

  const handleConvertOpportunity = async (opp: Opportunity) => {
    if (!selectedPropertyId) return;
    try {
      const res = await fetch("/api/content/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          title: opp.title,
          targetKeyword: opp.targetKeyword,
          searchIntent: "Informational",
          contentType: "Blog Post",
          priority: "MEDIUM",
          source: opp.source,
          status: "IDEA"
        })
      });
      if (res.ok) {
        // Remove converted opp locally
        setOpportunities(opportunities.filter(o => o.id !== opp.id));
        loadItems();
      }
    } catch (err) {
      console.error("Failed to convert opportunity:", err);
    }
  };

  const handleOpenBriefDrawer = (item: ContentItem) => {
    setSelectedItem(item);
    setBriefPrimary(item.brief?.primaryKeywords || item.targetKeyword);
    setBriefSecondary(item.brief?.secondaryKeywords || "");
    setBriefAudience(item.brief?.targetAudience || "");
    setBriefSuggestedUrl(item.brief?.suggestedUrl || "");
    setBriefSeoTitle(item.brief?.seoTitle || "");
    setBriefMetaDesc(item.brief?.metaDescription || "");
    setBriefWordCount(item.brief?.wordCountTarget?.toString() || "1000");
    setBriefOutline(item.brief?.outline || "");
    setBriefLinking(item.brief?.internalLinking || "");
    setBriefNotes(item.brief?.writerNotes || "");
    setIsBriefDrawerOpen(true);
  };

  const handleSaveBrief = async () => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`/api/content/items/${selectedItem.id}/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryKeywords: briefPrimary,
          secondaryKeywords: briefSecondary,
          targetAudience: briefAudience,
          suggestedUrl: briefSuggestedUrl,
          seoTitle: briefSeoTitle,
          metaDescription: briefMetaDesc,
          wordCountTarget: parseInt(briefWordCount, 10),
          outline: briefOutline,
          internalLinking: briefLinking,
          writerNotes: briefNotes
        })
      });
      if (res.ok) {
        setIsBriefDrawerOpen(false);
        loadItems();
      }
    } catch (err) {
      console.error("Failed to save brief:", err);
    }
  };

  const handleOpenDraftDrawer = (item: ContentItem) => {
    setSelectedItem(item);
    setDraftBody(item.draft?.body || "");
    setDraftReviewNotes(item.draft?.reviewNotes || "");
    setTransitionStatusInput(item.status);
    setPubLiveUrl(item.liveUrl || "");
    setPubNotes(item.pubNotes || "");
    setIsDraftDrawerOpen(true);
  };

  const handleSaveDraft = async () => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`/api/content/items/${selectedItem.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: draftBody,
          reviewNotes: draftReviewNotes
        })
      });
      if (res.ok) {
        setIsDraftDrawerOpen(false);
        loadItems();
      }
    } catch (err) {
      console.error("Failed to save draft:", err);
    }
  };

  const handleTransitionStatus = async (status: string) => {
    if (!selectedItem) return;
    try {
      const payload: any = { newStatus: status };
      if (status === "PUBLISHED") {
        payload.liveUrl = pubLiveUrl;
        payload.publishDate = new Date().toISOString();
        payload.pubNotes = pubNotes;
      }

      const res = await fetch(`/api/content/items/${selectedItem.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to transition status");
        return;
      }
      setIsDraftDrawerOpen(false);
      loadItems();
    } catch (err) {
      console.error("Failed to transition status:", err);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this content item?")) return;
    try {
      const res = await fetch(`/api/content/items/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        loadItems();
      }
    } catch (err) {
      console.error("Failed to delete content item:", err);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1500px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "600", margin: 0, color: "#0F172A" }}>Content Workflow System</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "14px" }}>Ideate, brief, draft, review, and track search performance for organic SEO campaigns.</p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {properties.length > 0 && (
            <select
              value={selectedPropertyId || ""}
              onChange={(e) => setSelectedPropertyId(parseInt(e.target.value, 10))}
              style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "white", fontSize: "13px", fontWeight: "600" }}
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.domain}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsIdeaModalOpen(true)}
            style={{
              padding: "8px 16px",
              background: "#0F172A",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Plus size={16} />
            Create Idea
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "1px", marginBottom: "24px" }}>
        {[
          { id: "dashboard", label: "Dashboard", icon: BookOpen },
          { id: "ideas", label: "Ideas & Opportunities", icon: Lightbulb },
          { id: "queue", label: "Briefs & Queue", icon: Clipboard },
          { id: "drafts", label: "Drafts & Review", icon: PenTool },
          { id: "library", label: "Published Library", icon: Globe }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                background: "transparent",
                border: "none",
                borderBottom: isSelected ? "2px solid #0F172A" : "2px solid transparent",
                color: isSelected ? "#0F172A" : "#64748B",
                fontWeight: isSelected ? "600" : "500",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "100px", background: "white", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <div className="spinner" />
        </div>
      ) : properties.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", background: "white", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <Globe size={48} style={{ color: "#94A3B8", marginBottom: "16px" }} />
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0F172A", margin: "0 0 8px 0" }}>No Properties Available</h2>
          <p style={{ color: "#64748B", fontSize: "14px", margin: "0" }}>Register a client website in the Clients dashboard to begin managing Content Hub workflows.</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Counts Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
                {[
                  { label: "Ideas & Research", count: (counts.IDEA || 0) + (counts.RESEARCH || 0), bg: "#F8FAFC", border: "#E2E8F0" },
                  { label: "Briefs & Planned", count: (counts.BRIEF || 0) + (counts.PLANNED || 0), bg: "#EFF6FF", border: "#BFDBFE" },
                  { label: "In Review & Approved", count: (counts.IN_REVIEW || 0) + (counts.APPROVED || 0), bg: "#ECFDF5", border: "#A7F3D0" },
                  { label: "Published Library", count: counts.PUBLISHED || 0, bg: "#F0FDF4", border: "#BBF7D0" }
                ].map((stat, idx) => (
                  <div key={idx} style={{ background: stat.bg, border: `1px solid ${stat.border}`, padding: "20px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>{stat.label}</span>
                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", marginTop: "8px" }}>{stat.count}</div>
                  </div>
                ))}
              </div>

              {/* Lists Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Upcoming Deadlines */}
                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "20px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 16px 0", color: "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={16} />
                    Upcoming Schedule
                  </h3>
                  {upcoming.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#64748B", textAlign: "center", padding: "20px 0" }}>No upcoming scheduled content items.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {upcoming.map(item => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", border: "1px solid #F1F5F9", borderRadius: "6px" }}>
                          <div>
                            <strong style={{ fontSize: "13px", color: "#0F172A" }}>{item.title}</strong>
                            <span style={{ display: "block", fontSize: "11px", color: "#64748B", textTransform: "capitalize", marginTop: "2px" }}>Status: {item.status.toLowerCase()}</span>
                          </div>
                          <span style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>{new Date(item.publishDate).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recently Published */}
                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "20px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 16px 0", color: "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Globe size={16} />
                    Recently Published
                  </h3>
                  {recentPublish.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#64748B", textAlign: "center", padding: "20px 0" }}>No recently published content library logs.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {recentPublish.map(item => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", border: "1px solid #F1F5F9", borderRadius: "6px" }}>
                          <div>
                            <strong style={{ fontSize: "13px", color: "#0F172A" }}>{item.title}</strong>
                            {item.liveUrl && (
                              <a href={item.liveUrl} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#0D9488", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "2px", marginTop: "2px" }}>
                                View Page
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                          <span style={{ fontSize: "12px", color: "#64748B" }}>{new Date(item.publishDate).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IDEAS & OPPORTUNITIES */}
          {activeTab === "ideas" && (
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "24px" }}>
              {/* Manual Ideas List */}
              <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", margin: 0, color: "#0F172A" }}>Active Ideas Pipeline</h3>
                </div>
                {items.filter(i => i.status === "IDEA" || i.status === "RESEARCH").length === 0 ? (
                  <p style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>No ideas or research tasks in the current pipeline.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: "600" }}>
                        <th style={{ padding: "12px 20px" }}>Title</th>
                        <th style={{ padding: "12px 20px" }}>Keyword</th>
                        <th style={{ padding: "12px 20px" }}>Intent / Type</th>
                        <th style={{ padding: "12px 20px" }}>Priority</th>
                        <th style={{ padding: "12px 20px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.filter(i => i.status === "IDEA" || i.status === "RESEARCH").map(item => (
                        <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 20px", fontWeight: "600" }}>{item.title}</td>
                          <td style={{ padding: "12px 20px" }}>{item.targetKeyword}</td>
                          <td style={{ padding: "12px 20px" }}>{item.searchIntent} / {item.contentType}</td>
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{
                              color: item.priority === "HIGH" ? "#EF4444" : item.priority === "MEDIUM" ? "#F59E0B" : "#64748B",
                              fontWeight: "600"
                            }}>{item.priority}</span>
                          </td>
                          <td style={{ padding: "12px 20px", display: "flex", gap: "10px" }}>
                            <button
                              onClick={() => handleOpenBriefDrawer(item)}
                              style={{ padding: "4px 8px", background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#2563EB", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                            >
                              Brief
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              style={{ padding: "4px 8px", background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Opportunities Panel */}
              <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "20px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 16px 0", color: "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Lightbulb size={16} />
                  GSC & SEO Opportunities
                </h3>

                {loadingOpps ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                    <div className="spinner" />
                  </div>
                ) : opportunities.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#64748B", textAlign: "center", padding: "20px 0" }}>No matching opportunities found in Search Console or Rankings snapshots.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {opportunities.map(opp => (
                      <div key={opp.id} style={{ border: "1px solid #F1F5F9", padding: "14px", borderRadius: "6px", background: "#F8FAFC" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                          <span style={{
                            background: opp.source === "GSC" ? "#ECFDF5" : "#EFF6FF",
                            color: opp.source === "GSC" ? "#059669" : "#2563EB",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "10px",
                            fontWeight: "600"
                          }}>{opp.source}</span>
                          <span style={{ fontSize: "11px", color: "#64748B" }}>{opp.metricSummary}</span>
                        </div>
                        <h4 style={{ fontSize: "13px", fontWeight: "600", margin: "0 0 4px 0" }}>{opp.title}</h4>
                        <p style={{ fontSize: "11px", color: "#64748B", margin: "0 0 10px 0" }}>{opp.suggestedAction}</p>
                        <button
                          onClick={() => handleConvertOpportunity(opp)}
                          style={{
                            padding: "4px 8px",
                            background: "white",
                            border: "1px solid #E2E8F0",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          Convert to Idea
                          <ArrowRight size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: QUEUE & BRIEFS */}
          {activeTab === "queue" && (
            <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", margin: 0, color: "#0F172A" }}>Content Creation Queue</h3>
              </div>
              {items.filter(i => i.status === "BRIEF" || i.status === "PLANNED" || i.status === "DRAFTING").length === 0 ? (
                <p style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>No items currently in BRIEF or PLANNED status queue.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: "600" }}>
                      <th style={{ padding: "12px 20px" }}>Title</th>
                      <th style={{ padding: "12px 20px" }}>Keyword</th>
                      <th style={{ padding: "12px 20px" }}>Status</th>
                      <th style={{ padding: "12px 20px" }}>Target Word Count</th>
                      <th style={{ padding: "12px 20px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(i => i.status === "BRIEF" || i.status === "PLANNED" || i.status === "DRAFTING").map(item => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "12px 20px", fontWeight: "600" }}>{item.title}</td>
                        <td style={{ padding: "12px 20px" }}>{item.targetKeyword}</td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{ textTransform: "capitalize", fontWeight: "600" }}>{item.status.toLowerCase()}</span>
                        </td>
                        <td style={{ padding: "12px 20px" }}>{item.brief?.wordCountTarget || "Not set"} words</td>
                        <td style={{ padding: "12px 20px", display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => handleOpenBriefDrawer(item)}
                            style={{ padding: "4px 8px", background: "white", border: "1px solid #E2E8F0", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                          >
                            Edit Brief
                          </button>
                          <button
                            onClick={() => handleOpenDraftDrawer(item)}
                            style={{ padding: "4px 8px", background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#2563EB", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                          >
                            Write Draft
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 4: DRAFTS & REVIEW */}
          {activeTab === "drafts" && (
            <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", margin: 0, color: "#0F172A" }}>Review & Approvals Panel</h3>
              </div>
              {items.filter(i => ["IN_REVIEW", "APPROVED", "SCHEDULED"].includes(i.status)).length === 0 ? (
                <p style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>No content drafts currently in review or awaiting approval.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: "600" }}>
                      <th style={{ padding: "12px 20px" }}>Title</th>
                      <th style={{ padding: "12px 20px" }}>Status</th>
                      <th style={{ padding: "12px 20px" }}>Publish Date Goal</th>
                      <th style={{ padding: "12px 20px" }}>Notes</th>
                      <th style={{ padding: "12px 20px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(i => ["IN_REVIEW", "APPROVED", "SCHEDULED"].includes(i.status)).map(item => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "12px 20px", fontWeight: "600" }}>{item.title}</td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            background: item.status === "APPROVED" ? "#ECFDF5" : "#EFF6FF",
                            color: item.status === "APPROVED" ? "#059669" : "#2563EB"
                          }}>{item.status}</span>
                        </td>
                        <td style={{ padding: "12px 20px" }}>{item.publishDate ? new Date(item.publishDate).toLocaleDateString() : "No date set"}</td>
                        <td style={{ padding: "12px 20px", color: "#64748B" }}>
                          {item.draft?.reviewNotes ? (item.draft.reviewNotes.length > 60 ? item.draft.reviewNotes.slice(0, 60) + "..." : item.draft.reviewNotes) : "No review comments"}
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <button
                            onClick={() => handleOpenDraftDrawer(item)}
                            style={{ padding: "4px 10px", background: "white", border: "1px solid #E2E8F0", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                          >
                            Review Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 5: PUBLISHED LIBRARY */}
          {activeTab === "library" && (
            <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", margin: 0, color: "#0F172A" }}>Organic Content Library</h3>
              </div>
              {items.filter(i => i.status === "PUBLISHED").length === 0 ? (
                <p style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>No published articles logged in this profile library.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: "600" }}>
                      <th style={{ padding: "12px 20px" }}>Published Title</th>
                      <th style={{ padding: "12px 20px" }}>Target Keyword</th>
                      <th style={{ padding: "12px 20px" }}>Publish Date</th>
                      <th style={{ padding: "12px 20px" }}>Live URL</th>
                      <th style={{ padding: "12px 20px" }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(i => i.status === "PUBLISHED").map(item => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "12px 20px", fontWeight: "600" }}>{item.title}</td>
                        <td style={{ padding: "12px 20px" }}>{item.targetKeyword}</td>
                        <td style={{ padding: "12px 20px" }}>{item.publishDate ? new Date(item.publishDate).toLocaleDateString() : "Unknown"}</td>
                        <td style={{ padding: "12px 20px" }}>
                          {item.liveUrl ? (
                            <a href={item.liveUrl} target="_blank" rel="noreferrer" style={{ color: "#0D9488", textDecoration: "none", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              Visit URL
                              <ExternalLink size={12} />
                            </a>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "12px 20px", color: "#64748B" }}>{item.pubNotes || "None"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Drawers / Modals ────────────────────────────────────────── */}

      {/* Idea Modal */}
      {isIdeaModalOpen && (
        <div className={styles.modalOverlay || "modal-overlay"} style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div style={{ background: "white", padding: "32px", borderRadius: "8px", width: "100%", maxWidth: "500px", border: "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 16px 0" }}>Create New Content Idea</h3>
            <form onSubmit={handleCreateIdea} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#64748B", fontWeight: "600", marginBottom: "4px" }}>Title / Topic</label>
                <input
                  type="text"
                  required
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  placeholder="e.g. 10 Local SEO Tips for Storefronts"
                  style={{ width: "100%", padding: "8px", border: "1px solid #E2E8F0", borderRadius: "6px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#64748B", fontWeight: "600", marginBottom: "4px" }}>Target Keyword</label>
                <input
                  type="text"
                  required
                  value={newIdeaKeyword}
                  onChange={(e) => setNewIdeaKeyword(e.target.value)}
                  placeholder="e.g. local seo tips"
                  style={{ width: "100%", padding: "8px", border: "1px solid #E2E8F0", borderRadius: "6px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#64748B", fontWeight: "600", marginBottom: "4px" }}>Search Intent</label>
                  <select
                    value={newIdeaIntent}
                    onChange={(e) => setNewIdeaIntent(e.target.value)}
                    style={{ width: "100%", padding: "8px", border: "1px solid #E2E8F0", borderRadius: "6px" }}
                  >
                    <option value="Informational">Informational</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Transactional">Transactional</option>
                    <option value="Navigational">Navigational</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#64748B", fontWeight: "600", marginBottom: "4px" }}>Content Type</label>
                  <select
                    value={newIdeaType}
                    onChange={(e) => setNewIdeaType(e.target.value)}
                    style={{ width: "100%", padding: "8px", border: "1px solid #E2E8F0", borderRadius: "6px" }}
                  >
                    <option value="Blog Post">Blog Post</option>
                    <option value="Landing Page">Landing Page</option>
                    <option value="Ultimate Guide">Ultimate Guide</option>
                    <option value="Case Study">Case Study</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#64748B", fontWeight: "600", marginBottom: "4px" }}>Priority</label>
                <select
                  value={newIdeaPriority}
                  onChange={(e) => setNewIdeaPriority(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "1px solid #E2E8F0", borderRadius: "6px" }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setIsIdeaModalOpen(false)} style={{ padding: "8px 16px", background: "#F1F5F9", border: "none", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#0F172A", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>Create Idea</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brief Drawer */}
      {isBriefDrawerOpen && selectedItem && (
        <div style={{
          position: "fixed", top: 0, right: 0, width: "500px", bottom: 0,
          background: "white", boxShadow: "-4px 0 10px rgba(0,0,0,0.05)", borderLeft: "1px solid #E2E8F0",
          zIndex: 1000, display: "flex", flexDirection: "column"
        }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "600", margin: 0 }}>SEO Content Brief Editor</h3>
              <small style={{ color: "#64748B" }}>{selectedItem.title}</small>
            </div>
            <button onClick={() => setIsBriefDrawerOpen(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>&times;</button>
          </div>

          <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div>
              <label style={{ display: "block", color: "#64748B", marginBottom: "4px", fontWeight: "600" }}>Primary Keyword</label>
              <input type="text" value={briefPrimary} onChange={(e) => setBriefPrimary(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #E2E8F0", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748B", marginBottom: "4px", fontWeight: "600" }}>Secondary Keywords (Comma separated)</label>
              <input type="text" value={briefSecondary} onChange={(e) => setBriefSecondary(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #E2E8F0", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748B", marginBottom: "4px", fontWeight: "600" }}>Word Count Goal</label>
              <input type="number" value={briefWordCount} onChange={(e) => setBriefWordCount(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #E2E8F0", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748B", marginBottom: "4px", fontWeight: "600" }}>Target Audience</label>
              <input type="text" value={briefAudience} onChange={(e) => setBriefAudience(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #E2E8F0", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748B", marginBottom: "4px", fontWeight: "600" }}>Suggested URL Path</label>
              <input type="text" value={briefSuggestedUrl} onChange={(e) => setBriefSuggestedUrl(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #E2E8F0", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748B", marginBottom: "4px", fontWeight: "600" }}>SEO Title Template</label>
              <input type="text" value={briefSeoTitle} onChange={(e) => setBriefSeoTitle(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #E2E8F0", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748B", marginBottom: "4px", fontWeight: "600" }}>Meta Description</label>
              <textarea value={briefMetaDesc} onChange={(e) => setBriefMetaDesc(e.target.value)} rows={2} style={{ width: "100%", padding: "6px", border: "1px solid #E2E8F0", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748B", marginBottom: "4px", fontWeight: "600" }}>Outline / Headings Structure</label>
              <textarea value={briefOutline} onChange={(e) => setBriefOutline(e.target.value)} rows={4} placeholder="e.g. H2: Introduction, H2: Top 5 Tips..." style={{ width: "100%", padding: "6px", border: "1px solid #E2E8F0", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748B", marginBottom: "4px", fontWeight: "600" }}>Internal Linking Suggestions</label>
              <input type="text" value={briefLinking} onChange={(e) => setBriefLinking(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #E2E8F0", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748B", marginBottom: "4px", fontWeight: "600" }}>Writer Notes</label>
              <textarea value={briefNotes} onChange={(e) => setBriefNotes(e.target.value)} rows={3} style={{ width: "100%", padding: "6px", border: "1px solid #E2E8F0", borderRadius: "4px" }} />
            </div>
          </div>

          <div style={{ padding: "20px", borderTop: "1px solid #E2E8F0", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={() => setIsBriefDrawerOpen(false)} style={{ padding: "8px 16px", background: "#F1F5F9", border: "none", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSaveBrief} style={{ padding: "8px 16px", background: "#0F172A", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>Save Brief</button>
          </div>
        </div>
      )}

      {/* Draft Drawer */}
      {isDraftDrawerOpen && selectedItem && (
        <div style={{
          position: "fixed", top: 0, right: 0, width: "600px", bottom: 0,
          background: "white", boxShadow: "-4px 0 10px rgba(0,0,0,0.05)", borderLeft: "1px solid #E2E8F0",
          zIndex: 1000, display: "flex", flexDirection: "column"
        }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "600", margin: 0 }}>Content Editor & Review Console</h3>
              <small style={{ color: "#64748B" }}>{selectedItem.title}</small>
            </div>
            <button onClick={() => setIsDraftDrawerOpen(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>&times;</button>
          </div>

          <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
            {/* Editor body */}
            <div>
              <label style={{ display: "block", color: "#64748B", marginBottom: "6px", fontWeight: "600" }}>Draft Body</label>
              <textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                rows={12}
                placeholder="Write your blog post or landing page content here..."
                style={{ width: "100%", padding: "10px", border: "1px solid #E2E8F0", borderRadius: "6px", fontFamily: "monospace" }}
              />
            </div>

            {/* Review Notes */}
            <div>
              <label style={{ display: "block", color: "#64748B", marginBottom: "6px", fontWeight: "600" }}>Review Feedback / Revision Notes</label>
              <textarea
                value={draftReviewNotes}
                onChange={(e) => setDraftReviewNotes(e.target.value)}
                rows={3}
                placeholder="Add suggestions, revisions requested, or feedback notes..."
                style={{ width: "100%", padding: "8px", border: "1px solid #E2E8F0", borderRadius: "6px" }}
              />
            </div>

            {/* If published is selected, show url settings */}
            {transitionStatusInput === "PUBLISHED" && (
              <div style={{ border: "1px solid #B2F5EA", background: "#E6FFFA", padding: "14px", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700" }}>Live Publication Details</h4>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", marginBottom: "4px" }}>Live URL</label>
                  <input
                    type="url"
                    required
                    value={pubLiveUrl}
                    onChange={(e) => setPubLiveUrl(e.target.value)}
                    placeholder="https://example.com/blog/local-seo-tips"
                    style={{ width: "100%", padding: "6px", border: "1px solid #E2E8F0", borderRadius: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", marginBottom: "4px" }}>Publication Notes</label>
                  <input
                    type="text"
                    value={pubNotes}
                    onChange={(e) => setPubNotes(e.target.value)}
                    placeholder="e.g. Published on WordPress main blog"
                    style={{ width: "100%", padding: "6px", border: "1px solid #E2E8F0", borderRadius: "4px" }}
                  />
                </div>
              </div>
            )}

            {/* Status Transition Control */}
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
              <label style={{ display: "block", color: "#64748B", marginBottom: "6px", fontWeight: "600" }}>Workflow Action</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { label: "Start Research", to: "RESEARCH", current: "IDEA" },
                  { label: "Create Brief", to: "BRIEF", current: "RESEARCH" },
                  { label: "Plan Work", to: "PLANNED", current: "BRIEF" },
                  { label: "Start Drafting", to: "DRAFTING", current: "PLANNED" },
                  { label: "Submit for Review", to: "IN_REVIEW", current: "DRAFTING" },
                  { label: "Request Revisions", to: "DRAFTING", current: "IN_REVIEW", isBack: true },
                  { label: "Approve Content", to: "APPROVED", current: "IN_REVIEW" },
                  { label: "Schedule Post", to: "SCHEDULED", current: "APPROVED" },
                  { label: "Mark Published", to: "PUBLISHED", current: "SCHEDULED" }
                ].map((action, idx) => {
                  const isAvailable = selectedItem.status === action.current;
                  if (!isAvailable) return null;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setTransitionStatusInput(action.to);
                        handleTransitionStatus(action.to);
                      }}
                      style={{
                        padding: "6px 12px",
                        background: action.isBack ? "#FFFBEB" : "#0F172A",
                        color: action.isBack ? "#B45309" : "white",
                        border: action.isBack ? "1px solid #FDE68A" : "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "12px"
                      }}
                    >
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ padding: "20px", borderTop: "1px solid #E2E8F0", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={() => setIsDraftDrawerOpen(false)} style={{ padding: "8px 16px", background: "#F1F5F9", border: "none", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSaveDraft} style={{ padding: "8px 16px", background: "#0D9488", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>Save Draft Changes</button>
          </div>
        </div>
      )}
    </div>
  );
}
