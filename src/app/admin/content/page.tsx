"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Archive,
  X
} from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";

interface ClientContentCard {
  id: string;
  name: string;
  domain: string;
  statusTag: string;
  stages: {
    brief: number;
    drafted: number;
    editing: number;
    review: number;
    published: number;
  };
  publishedThisMonth: {
    count: number;
    changePct: number;
  };
  pageUpdatesThisMonth: {
    written: number;
    published: number;
  };
  goal: {
    target: number;
    achieved: number;
    status: string;
  };
}

interface ContentHubPayload {
  kpis: {
    inProgress: number;
    readyForReview: number;
    awaitingClient: number;
    backFromClient: number;
    publishing: number;
    publishedThisMonth: number;
  };
  clients: ClientContentCard[];
}

export default function ContentHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pipeline" | "calendar">("pipeline");
  const [data, setData] = useState<ContentHubPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("This month");
  const [selectedClient, setSelectedClient] = useState("All clients");
  const [selectedSort, setSelectedSort] = useState("name");
  const [showArchived, setShowArchived] = useState(false);

  // Calendar data
  const [calendarData, setCalendarData] = useState<{
    monthName: string;
    year: number;
    monthIndex: number;
    summary: { editingHandovers: number; published: number; deadlines: number };
    eventsByDay: Record<string, Array<{ type: string; title: string; clientName: string; stage: string }>>;
  } | null>(null);
  const [calMonthOffset, setCalMonthOffset] = useState(0);

  // Quick Add Piece Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addClientId, setAddClientId] = useState("");
  const [addKeyword, setAddKeyword] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { toast, success, error: toastError } = useToast();

  const fetchHub = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/content/hub?search=${encodeURIComponent(search)}&archived=${showArchived}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load content hub.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error(err);
      setError(errObj?.message || "Error loading content.");
    } finally {
      setLoading(false);
    }
  }, [search, showArchived, router]);

  const fetchCalendar = useCallback(async () => {
    try {
      const d = new Date();
      d.setMonth(d.getMonth() + calMonthOffset);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const res = await fetch(`/api/content/calendar?month=${mStr}&clientId=${selectedClient === "All clients" ? "" : selectedClient}`);
      if (res.ok) {
        const json = await res.json();
        setCalendarData(json);
      }
    } catch (err) {
      console.error(err);
    }
  }, [calMonthOffset, selectedClient]);

  useEffect(() => {
    fetchHub();
  }, [fetchHub]);

  useEffect(() => {
    if (activeTab === "calendar") {
      fetchCalendar();
    }
  }, [activeTab, fetchCalendar]);

  const handleQuickAddPiece = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addClientId || !addKeyword) {
      toastError("Please select a client and provide a target keyword.");
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch(`/api/content/client/${addClientId}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKeyword: addKeyword,
          title: addTitle || addKeyword,
          contentType: "Blog post",
          tier: "commodity",
        }),
      });
      if (!res.ok) throw new Error("Failed to create piece.");
      success("Content piece created!");
      setIsAddOpen(false);
      setAddKeyword("");
      setAddTitle("");
      fetchHub();
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Error adding piece.");
    } finally {
      setIsAdding(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "28px 0 80px 0" }}>
      <div style={{ maxWidth: "1380px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TOP HEADER */}
        <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
          CONTENT
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
              Content
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
              Every piece across every client. {todayFormatted}.
            </p>
          </div>

          <div>
            <button
              onClick={() => setIsAddOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 18px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#FFFFFF",
                background: "#0F4C5C",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
              }}
            >
              + Add piece
            </button>
          </div>
        </div>

        {/* 2. SUB-TABS: PIPELINE | CALENDAR */}
        <div style={{ display: "flex", gap: "20px", borderBottom: "1px solid #E2E8F0", marginBottom: "24px" }}>
          <button
            onClick={() => setActiveTab("pipeline")}
            style={{
              padding: "8px 4px 12px 4px",
              fontSize: "0.9375rem",
              fontWeight: activeTab === "pipeline" ? "700" : "500",
              color: activeTab === "pipeline" ? "#0F4C5C" : "#64748B",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "pipeline" ? "2px solid #0F4C5C" : "2px solid transparent",
              cursor: "pointer"
            }}
          >
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            style={{
              padding: "8px 4px 12px 4px",
              fontSize: "0.9375rem",
              fontWeight: activeTab === "calendar" ? "700" : "500",
              color: activeTab === "calendar" ? "#0F4C5C" : "#64748B",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "calendar" ? "2px solid #0F4C5C" : "2px solid transparent",
              cursor: "pointer"
            }}
          >
            Calendar
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PIPELINE TAB */}
        {/* ========================================================================= */}
        {activeTab === "pipeline" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* 6 TOP STAGE KPI BADGES */}
            {data && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
                {/* 1. IN PROGRESS */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>IN PROGRESS</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "4px 0 2px 0" }}>{data.kpis.inProgress}</div>
                  <div style={{ fontSize: "0.6875rem", color: "#94A3B8" }}>drafts moving through the pipeline</div>
                </div>

                {/* 2. READY FOR REVIEW */}
                <div style={{ background: "#E0F2FE", border: "1px solid #BAE6FD", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#0369A1", textTransform: "uppercase" }}>READY FOR REVIEW</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0284C7", margin: "4px 0 2px 0" }}>{data.kpis.readyForReview}</div>
                  <div style={{ fontSize: "0.6875rem", color: "#0284C7" }}>writer finished — needs you</div>
                </div>

                {/* 3. AWAITING CLIENT */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>AWAITING CLIENT</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "4px 0 2px 0" }}>{data.kpis.awaitingClient}</div>
                  <div style={{ fontSize: "0.6875rem", color: "#94A3B8" }}>sent for review, not yet decided</div>
                </div>

                {/* 4. BACK FROM CLIENT */}
                <div style={{ background: "#FFEDD5", border: "1px solid #FED7AA", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#C2410C", textTransform: "uppercase" }}>BACK FROM CLIENT</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#EA580C", margin: "4px 0 2px 0" }}>{data.kpis.backFromClient}</div>
                  <div style={{ fontSize: "0.6875rem", color: "#C2410C" }}>revisions requested — action needed</div>
                </div>

                {/* 5. PUBLISHING */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>PUBLISHING</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "4px 0 2px 0" }}>{data.kpis.publishing}</div>
                  <div style={{ fontSize: "0.6875rem", color: "#94A3B8" }}>approved — in the publish queue</div>
                </div>

                {/* 6. PUBLISHED THIS MONTH */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>PUBLISHED THIS MONTH</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "4px 0 2px 0" }}>{data.kpis.publishedThisMonth}</div>
                  <div style={{ fontSize: "0.6875rem", color: "#94A3B8" }}>live on client sites</div>
                </div>
              </div>
            )}

            {/* FILTER ROW */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ position: "relative", width: "260px" }}>
                  <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input
                    type="text"
                    placeholder="Search client name or domain..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: "100%", padding: "7px 12px 7px 34px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#FFFFFF", fontSize: "0.8125rem", outline: "none" }}
                  />
                </div>

                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#FFFFFF", fontSize: "0.8125rem", color: "#334155", outline: "none" }}
                >
                  <option>This month</option>
                  <option>Last month</option>
                  <option>Next month</option>
                </select>

                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#FFFFFF", fontSize: "0.8125rem", color: "#334155", outline: "none" }}
                >
                  <option>All clients</option>
                  {data?.clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#FFFFFF", fontSize: "0.8125rem", color: "#334155", outline: "none" }}
                >
                  <option value="name">Sort: name</option>
                  <option value="activity">Sort: active</option>
                  <option value="published">Sort: published</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.8125rem", color: "#64748B" }}>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  style={{ background: "transparent", border: "none", color: "#64748B", textDecoration: "underline", cursor: "pointer", fontSize: "0.8125rem" }}
                >
                  {showArchived ? "Hide archived" : "Show archived"}
                </button>
                <span>{data?.clients.length || 0} clients</span>
              </div>
            </div>

            {/* 3-COLUMN CLIENT PIPELINE CARDS GRID */}
            {loading && !data ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                <RefreshCw className={styles.spinner} size={32} />
              </div>
            ) : data && data.clients.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                {data.clients.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      padding: "20px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "16px",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease"
                    }}
                  >
                    <div>
                      {/* Card Top: Client name + tag */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                        <div>
                          <Link
                            href={`/admin/content/${c.id}`}
                            style={{ fontSize: "1rem", fontWeight: "700", color: "#0F172A", textDecoration: "none" }}
                          >
                            {c.name}
                          </Link>
                          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                            https://{c.domain}/
                          </div>
                        </div>

                        {c.statusTag && (
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: "600",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: c.statusTag.includes("with client") ? "#FEF3C7" : c.statusTag.includes("active") ? "#E0F2FE" : "#F1F5F9",
                              color: c.statusTag.includes("with client") ? "#B45309" : c.statusTag.includes("active") ? "#0369A1" : "#475569"
                            }}
                          >
                            {c.statusTag}
                          </span>
                        )}
                      </div>

                      {/* 5 Stage Counters */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px", background: "#F8FAFC", borderRadius: "8px", padding: "10px 8px", marginTop: "14px", textAlign: "center" }}>
                        <div>
                          <div style={{ fontSize: "0.625rem", color: "#94A3B8", fontWeight: "700" }}>BRIEF</div>
                          <div style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A" }}>{c.stages.brief}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.625rem", color: "#94A3B8", fontWeight: "700" }}>DRAFTED</div>
                          <div style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A" }}>{c.stages.drafted}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.625rem", color: "#94A3B8", fontWeight: "700" }}>EDITING</div>
                          <div style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A" }}>{c.stages.editing}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.625rem", color: "#94A3B8", fontWeight: "700" }}>REVIEW</div>
                          <div style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A" }}>{c.stages.review}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.625rem", color: "#94A3B8", fontWeight: "700" }}>PUBLISHED</div>
                          <div style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A" }}>{c.stages.published}</div>
                        </div>
                      </div>

                      {/* Published stats & Page updates */}
                      <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.775rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748B", fontWeight: "600", textTransform: "uppercase", fontSize: "0.6875rem" }}>PUBLISHED THIS MONTH</span>
                          <strong style={{ color: "#0F172A" }}>{c.publishedThisMonth.count} {c.publishedThisMonth.changePct > 0 && <span style={{ color: "#16A34A" }}>▲ {c.publishedThisMonth.changePct}%</span>}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748B", fontWeight: "600", textTransform: "uppercase", fontSize: "0.6875rem" }}>PAGE UPDATES THIS MONTH</span>
                          <span><strong style={{ color: "#0F172A" }}>{c.pageUpdatesThisMonth.written}</strong> written · <strong style={{ color: "#16A34A" }}>{c.pageUpdatesThisMonth.published} published</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom: Goal + Open Pipeline */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F1F5F9", paddingTop: "12px", marginTop: "4px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        {c.goal.achieved} of {c.goal.target} · goal: <span style={{ color: c.goal.status === "hit" ? "#16A34A" : "#D97706", fontWeight: "600" }}>this month {c.goal.status}</span>
                      </span>

                      <Link
                        href={`/admin/content/${c.id}`}
                        style={{
                          fontSize: "0.775rem",
                          fontWeight: "600",
                          color: "#0F4C5C",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        Open pipeline →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "#FFFFFF", padding: "40px", borderRadius: "12px", textAlign: "center", color: "#64748B" }}>
                No clients found matching the selected filters.
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* CALENDAR TAB */}
        {/* ========================================================================= */}
        {activeTab === "calendar" && calendarData && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Top Month Navigation Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px 18px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    onClick={() => setCalMonthOffset(calMonthOffset - 1)}
                    style={{ background: "transparent", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: "1rem", fontWeight: "800", color: "#0F172A", minWidth: "130px", textAlign: "center" }}>
                    {calendarData.monthName}
                  </span>
                  <button
                    onClick={() => setCalMonthOffset(calMonthOffset + 1)}
                    style={{ background: "transparent", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                <button
                  onClick={() => setCalMonthOffset(0)}
                  style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "4px", background: "#F1F5F9", border: "1px solid #E2E8F0", cursor: "pointer" }}
                >
                  Today
                </button>
              </div>

              {/* Legend & Stats */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.775rem", color: "#475569" }}>
                <span>● <strong style={{ color: "#0F172A" }}>{calendarData.summary.editingHandovers}</strong> editing handovers</span>
                <span>● <strong style={{ color: "#16A34A" }}>{calendarData.summary.published}</strong> published</span>
                <span>● <strong style={{ color: "#DC2626" }}>{calendarData.summary.deadlines}</strong> deadlines</span>
              </div>
            </div>

            {/* Calendar Grid (Mon-Sun) */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
              {/* Day Headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "center", padding: "10px 0", fontSize: "0.75rem", fontWeight: "700", color: "#64748B" }}>
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
                <div>SUN</div>
              </div>

              {/* Days Matrix (5 weeks x 7 days) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(120px, auto)" }}>
                {Array.from({ length: 35 }).map((_, idx) => {
                  const dayNum = ((idx + 27) % 31) + 1; // Example day numbering mapping
                  const isToday = dayNum === new Date().getDate();
                  const dateStr = `2026-08-${String(dayNum).padStart(2, "0")}`;
                  const dayEvents = calendarData.eventsByDay[dateStr] || [];

                  return (
                    <div
                      key={idx}
                      style={{
                        borderRight: (idx + 1) % 7 === 0 ? "none" : "1px solid #F1F5F9",
                        borderBottom: "1px solid #F1F5F9",
                        padding: "8px",
                        background: isToday ? "#F0FDFA" : "#FFFFFF",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "700", color: isToday ? "#0F766E" : "#64748B" }}>
                          {dayNum}
                        </span>
                        {isToday && (
                          <span style={{ fontSize: "0.625rem", fontWeight: "800", background: "#0F4C5C", color: "#FFFFFF", padding: "1px 5px", borderRadius: "3px" }}>
                            TODAY
                          </span>
                        )}
                      </div>

                      {/* Event Pills */}
                      {dayEvents.slice(0, 3).map((ev, evIdx) => {
                        let bg = "#F1F5F9";
                        let col = "#334155";
                        if (ev.type === "PUBLISHED") { bg = "#DCFCE7"; col = "#15803D"; }
                        else if (ev.type === "DRAFTED") { bg = "#DBEAFE"; col = "#1D4ED8"; }
                        else if (ev.type === "EDITING DONE") { bg = "#E0F2FE"; col = "#0369A1"; }
                        else if (ev.type === "CLIENT EDITED") { bg = "#FFEDD5"; col = "#C2410C"; }

                        return (
                          <div
                            key={evIdx}
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: "600",
                              background: bg,
                              color: col,
                              padding: "2px 5px",
                              borderRadius: "3px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                          >
                            • {ev.type}
                            <div style={{ fontWeight: "400", opacity: 0.9 }}>{ev.title}</div>
                          </div>
                        );
                      })}

                      {dayEvents.length > 3 && (
                        <div style={{ fontSize: "0.625rem", color: "#94A3B8", fontWeight: "600" }}>
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* QUICK ADD PIECE MODAL */}
        {isAddOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px"
            }}
          >
            <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "480px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0F172A", margin: 0 }}>Add Content Piece</h3>
                <button onClick={() => setIsAddOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleQuickAddPiece} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Select Client *
                  </label>
                  <select
                    required
                    value={addClientId}
                    onChange={(e) => setAddClientId(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none" }}
                  >
                    <option value="">-- Choose client --</option>
                    {data?.clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Target Keyword *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. how long does roof repair take"
                    value={addKeyword}
                    onChange={(e) => setAddKeyword(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Article Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Complete Guide to Roof Repair Times"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    style={{ padding: "8px 14px", fontSize: "0.8125rem", fontWeight: "600", color: "#475569", background: "#F1F5F9", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    style={{ padding: "8px 18px", fontSize: "0.8125rem", fontWeight: "600", color: "#FFFFFF", background: "#0F4C5C", border: "none", borderRadius: "6px", cursor: isAdding ? "not-allowed" : "pointer" }}
                  >
                    {isAdding ? "Adding..." : "Add to Pipeline"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
