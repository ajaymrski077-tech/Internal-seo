"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, Copy, Check } from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";

interface GlobalIdea {
  id: string;
  displayId: number;
  title: string;
  targetKeyword: string;
  clientId: string;
  clientName: string;
  outlineText: string;
  hasOutline: boolean;
  hasBrief: boolean;
  draftNumber: number | null;
  lastRun: string;
}

export default function GlobalIdeasPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<GlobalIdea[]>([]);
  const [activeFilter, setActiveFilter] = useState<"outline" | "all">("outline");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { toast, success, error: toastError } = useToast();

  const fetchGlobalIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/ideas?hasOutline=${activeFilter === "outline"}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const json = await res.json();
        setIdeas(json.ideas || []);
      } else {
        setIdeas([]);
      }
    } catch {
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, search]);

  useEffect(() => {
    fetchGlobalIdeas();
  }, [fetchGlobalIdeas]);

  const handleCopyIdea = (item: GlobalIdea) => {
    const textToCopy = `${item.title}\nTarget Keyword: ${item.targetKeyword}\nOutline: ${item.outlineText || "8 H2 / 10 H3"}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    success(`Outline copied for "${item.title}"!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredIdeas = ideas.filter((item) => {
    if (!search) return true;
    return (
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.targetKeyword.toLowerCase().includes(search.toLowerCase()) ||
      item.clientName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "28px 0 80px 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TITLE & SUBTITLE */}
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
            Ideas
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
            {ideas.length} ideas with an approved outline
          </p>
        </div>

        {/* 2. FILTER BUTTONS */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            onClick={() => setActiveFilter("outline")}
            style={{
              padding: "6px 14px",
              fontSize: "0.8125rem",
              fontWeight: "700",
              borderRadius: "4px",
              border: "none",
              background: activeFilter === "outline" ? "#0F172A" : "#FFFFFF",
              color: activeFilter === "outline" ? "#FFFFFF" : "#64748B",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
            }}
          >
            Has an outline ({ideas.length})
          </button>
          <button
            onClick={() => setActiveFilter("all")}
            style={{
              padding: "6px 14px",
              fontSize: "0.8125rem",
              fontWeight: "700",
              borderRadius: "4px",
              border: "none",
              background: activeFilter === "all" ? "#0F172A" : "#FFFFFF",
              color: activeFilter === "all" ? "#FFFFFF" : "#64748B",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
            }}
          >
            All ideas (298)
          </button>
        </div>

        {/* 3. INFO CALLOUT NOTE */}
        <div style={{ fontSize: "0.775rem", color: "#64748B", lineHeight: "1.5", marginBottom: "20px", maxWidth: "1140px" }}>
          Copy takes an idea as far as its outline: the outline tree, sub-queries, entities including required flags, and the competitor crawl. It does not copy the brief, the draft or any pipeline run, so the copy lands ready to generate a brief. Use it to test a brief or draft change without rebuilding an outline first.
        </div>

        {/* 4. SEARCH INPUT */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ position: "relative", width: "300px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search ideas, keywords, clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "7px 12px 7px 32px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#FFFFFF", fontSize: "0.8125rem", outline: "none" }}
            />
          </div>
        </div>

        {/* 5. TABLE */}
        <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "12px 20px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>IDEA</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>CLIENT</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>OUTLINE</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>BRIEF</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>DRAFT</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>LAST RUN</th>
                <th style={{ padding: "12px 20px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredIdeas.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* IDEA */}
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "0.85rem" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "0.725rem", color: "#64748B", marginTop: "2px" }}>
                      #{item.displayId} · {item.targetKeyword}
                    </div>
                  </td>

                  {/* CLIENT */}
                  <td style={{ padding: "12px 14px" }}>
                    <Link
                      href={`/admin/content/${item.clientId}`}
                      style={{ fontSize: "0.8125rem", color: "#475569", textDecoration: "none" }}
                    >
                      {item.clientName}
                    </Link>
                  </td>

                  {/* OUTLINE */}
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: "0.725rem", fontWeight: "600", color: "#16A34A" }}>
                      {item.outlineText || "8 H2 / 10 H3"}
                    </span>
                  </td>

                  {/* BRIEF */}
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#16A34A" }}>
                      yes
                    </span>
                  </td>

                  {/* DRAFT */}
                  <td style={{ padding: "12px 14px" }}>
                    {item.draftNumber ? (
                      <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#0D9488" }}>
                        #{item.draftNumber}
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.8125rem", color: "#94A3B8" }}>—</span>
                    )}
                  </td>

                  {/* LAST RUN */}
                  <td style={{ padding: "12px 14px", fontSize: "0.775rem", color: "#64748B" }}>
                    {item.lastRun}
                  </td>

                  {/* COPY BUTTON */}
                  <td style={{ padding: "12px 20px", textAlign: "right" }}>
                    <button
                      onClick={() => handleCopyIdea(item)}
                      style={{
                        padding: "4px 12px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: "#334155",
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      {copiedId === item.id ? "Copied!" : "Copy"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
