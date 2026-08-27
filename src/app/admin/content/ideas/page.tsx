"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, CheckCircle2, Copy } from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";

interface GlobalIdea {
  id: string;
  title: string;
  targetKeyword: string;
  clientId: string;
  clientName: string;
  hasOutline: boolean;
  hasBrief: boolean;
  hasDraft: boolean;
  stage: string;
  lastRun: string;
}

export default function GlobalIdeasPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<GlobalIdea[]>([]);
  const [totalAll, setTotalAll] = useState(0);
  const [totalWithOutline, setTotalWithOutline] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"outline" | "all">("outline");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const { toast, success, error: toastError } = useToast();

  const fetchGlobalIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/ideas?hasOutline=${activeFilter === "outline"}&search=${encodeURIComponent(search)}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load ideas.");
      }
      const json = await res.json();
      setIdeas(json.ideas || []);
      setTotalAll(json.totalAll || 0);
      setTotalWithOutline(json.totalWithOutline || 0);
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error(err);
      toastError(errObj?.message || "Error loading ideas.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, search, router, toastError]);

  useEffect(() => {
    fetchGlobalIdeas();
  }, [fetchGlobalIdeas]);

  const handleCopyIdea = (idea: GlobalIdea) => {
    success(`Outline copied for "${idea.title}"! Ready to clone into backlog.`);
  };

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "28px 0 80px 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TITLE & SUBTITLE */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
            Ideas
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748B", margin: 0 }}>
            {totalWithOutline} ideas with an approved outline
          </p>
        </div>

        {/* 2. FILTER TABS: Has an outline (X) | All ideas (Y) */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <button
            onClick={() => setActiveFilter("outline")}
            style={{
              padding: "6px 16px",
              fontSize: "0.8125rem",
              fontWeight: "700",
              borderRadius: "6px",
              border: "none",
              background: activeFilter === "outline" ? "#0F172A" : "#FFFFFF",
              color: activeFilter === "outline" ? "#FFFFFF" : "#64748B",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
            }}
          >
            Has an outline ({totalWithOutline})
          </button>
          <button
            onClick={() => setActiveFilter("all")}
            style={{
              padding: "6px 16px",
              fontSize: "0.8125rem",
              fontWeight: "700",
              borderRadius: "6px",
              border: "none",
              background: activeFilter === "all" ? "#0F172A" : "#FFFFFF",
              color: activeFilter === "all" ? "#FFFFFF" : "#64748B",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
            }}
          >
            All ideas ({totalAll})
          </button>
        </div>

        {/* 3. INFO NOTE BOX */}
        <div style={{ fontSize: "0.775rem", color: "#64748B", lineHeight: "1.5", marginBottom: "24px", maxWidth: "1000px" }}>
          <strong>Copy</strong> takes an idea as far as its outline: title, target keyword, search intent, persona, angle, required flags, and the competitor crawl. It does not copy the brief, the draft or any pipeline run, so the copy lands ready to generate a brief. Use it to test a brief or draft against a slightly different angle, or to clone an outline into another client&apos;s backlog without re-running the crawler.
        </div>

        {/* 4. SEARCH BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ position: "relative", width: "320px" }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search ideas or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#FFFFFF", fontSize: "0.8125rem", outline: "none" }}
            />
          </div>
        </div>

        {/* 5. TABLE */}
        {loading && ideas.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <RefreshCw className={styles.spinner} size={32} />
          </div>
        ) : (
          <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "12px 20px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>IDEA</th>
                  <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>CLIENT</th>
                  <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>OUTLINE</th>
                  <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>BRIEF</th>
                  <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>DRAFT</th>
                  <th style={{ padding: "12px 20px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", textAlign: "right" }}>LAST RUN</th>
                </tr>
              </thead>
              <tbody>
                {ideas.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px 20px", textAlign: "center", color: "#64748B", fontSize: "0.875rem" }}>
                      No ideas found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  ideas.map((item) => (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* IDEA */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "0.875rem", color: "#0F172A" }}>{item.title}</strong>
                          <button
                            onClick={() => handleCopyIdea(item)}
                            title="Copy outline"
                            style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", display: "inline-flex", alignItems: "center", padding: "2px" }}
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                          kw: {item.targetKeyword}
                        </div>
                      </td>

                      {/* CLIENT */}
                      <td style={{ padding: "14px 14px" }}>
                        <Link
                          href={`/admin/content/${item.clientId}`}
                          style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#0F4C5C", textDecoration: "none" }}
                        >
                          {item.clientName}
                        </Link>
                      </td>

                      {/* OUTLINE */}
                      <td style={{ padding: "14px 14px" }}>
                        {item.hasOutline ? (
                          <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px", background: "#DCFCE7", color: "#15803D", fontWeight: "700" }}>
                            READY
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.8125rem", color: "#94A3B8" }}>—</span>
                        )}
                      </td>

                      {/* BRIEF */}
                      <td style={{ padding: "14px 14px" }}>
                        {item.hasBrief ? (
                          <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px", background: "#EDE9FE", color: "#6D28D9", fontWeight: "700" }}>
                            READY
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.8125rem", color: "#94A3B8" }}>—</span>
                        )}
                      </td>

                      {/* DRAFT */}
                      <td style={{ padding: "14px 14px" }}>
                        {item.hasDraft ? (
                          <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px", background: "#DBEAFE", color: "#1D4ED8", fontWeight: "700" }}>
                            READY
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.8125rem", color: "#94A3B8" }}>—</span>
                        )}
                      </td>

                      {/* LAST RUN */}
                      <td style={{ padding: "14px 20px", fontSize: "0.8125rem", color: "#64748B", textAlign: "right" }}>
                        {item.lastRun}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
