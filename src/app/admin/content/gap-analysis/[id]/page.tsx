"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Upload, Play } from "lucide-react";
import { useToast } from "@/components/ToastContext";

export default function ContentGapDetailPage() {
  const router = useRouter();
  const rawParams = useParams();
  const id = (rawParams?.id as string) || "mortgaged-supporting";

  const [ourSitemap, setOurSitemap] = useState("https://www.themortgaged.co.uk/sitemap_index.xml");
  const [competitorLabel, setCompetitorLabel] = useState("Celsius Pl");
  const [competitorSitemap, setCompetitorSitemap] = useState("https://competitor.com/sitemap.xml");
  const [isRunning, setIsRunning] = useState(false);

  const { toast, success, error: toastError } = useToast();

  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      success("Competitor gap analysis completed! 47 new opportunities identified.");
    }, 1200);
  };

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "28px 0 80px 0" }}>
      <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TOP BREADCRUMB */}
        <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#10B981", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
          <Link href="/admin/content/gap-analysis" style={{ color: "#10B981", textDecoration: "none" }}>
            CONTENT GAP
          </Link>{" "}
          → MORTGAGED
        </div>

        {/* 2. TITLE & TOP ACTION */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
            Mortgaged - Supporting
          </h1>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this content-gap project?")) {
                success("Project deleted.");
                router.push("/admin/content/gap-analysis");
              }
            }}
            style={{
              padding: "6px 16px",
              fontSize: "0.8125rem",
              fontWeight: "600",
              color: "#FFFFFF",
              background: "#EF4444",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Delete project
          </button>
        </div>

        {/* 3. RUN NEW ANALYSIS CARD */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A", margin: "0 0 16px 0" }}>
            Run new analysis
          </h3>

          <form onSubmit={handleStartAnalysis}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
              
              {/* Left Column: Our Sitemap & CSVs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Our sitemap URL
                  </label>
                  <input
                    type="text"
                    required
                    value={ourSitemap}
                    onChange={(e) => setOurSitemap(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                  />
                  <div style={{ fontSize: "0.6875rem", color: "#94A3B8", marginTop: "2px" }}>
                    Sitemap-index URLs are recursed automatically.
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Our Ahrefs Top Pages CSV (optional)
                  </label>
                  <input
                    type="file"
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.75rem" }}
                  />
                  <div style={{ fontSize: "0.6875rem", color: "#94A3B8", marginTop: "2px" }}>
                    Top Pages export. Tab- or comma-delimited.
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Our Ahrefs Organic Keywords CSV (optional)
                  </label>
                  <input
                    type="file"
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.75rem" }}
                  />
                  <div style={{ fontSize: "0.6875rem", color: "#94A3B8", marginTop: "2px" }}>
                    Organic keywords export. Links keywords to pages by URL and detects keyword gaps.
                  </div>
                </div>
              </div>

              {/* Right Column: Competitor(s) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ fontSize: "0.8125rem", fontWeight: "700", color: "#334155" }}>Competitor(s)</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "8px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "2px" }}>
                      LABEL <span style={{ fontWeight: "400", color: "#94A3B8" }}>(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Celsius Pl"
                      value={competitorLabel}
                      onChange={(e) => setCompetitorLabel(e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "2px" }}>
                      SITEMAP URL *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="https://competitor.com/sitemap.xml"
                      value={competitorSitemap}
                      onChange={(e) => setCompetitorSitemap(e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "2px" }}>
                      TOP PAGES CSV <span style={{ fontWeight: "400", color: "#94A3B8" }}>(optional)</span>
                    </label>
                    <input type="file" style={{ width: "100%", fontSize: "0.725rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "2px" }}>
                      KEYWORDS CSV <span style={{ fontWeight: "400", color: "#94A3B8" }}>(optional)</span>
                    </label>
                    <input type="file" style={{ width: "100%", fontSize: "0.725rem" }} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => success("Added competitor slot")}
                  style={{
                    alignSelf: "flex-start",
                    padding: "6px 14px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#FFFFFF",
                    background: "#6366F1",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  + Add competitor
                </button>
              </div>

            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={isRunning}
                style={{
                  padding: "9px 24px",
                  fontSize: "0.875rem",
                  fontWeight: "700",
                  color: "#FFFFFF",
                  background: "#10B981",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isRunning ? "not-allowed" : "pointer"
                }}
              >
                {isRunning ? "Running analysis..." : "Start analysis"}
              </button>
            </div>
          </form>
        </div>

        {/* 4. ANALYSES HISTORY TABLE */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A", margin: "0 0 14px 0" }}>
            Analyses
          </h3>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "10px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>DATE</th>
                <th style={{ padding: "10px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>STATUS</th>
                <th style={{ padding: "10px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>OUR PAGES</th>
                <th style={{ padding: "10px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>THEIR PAGES</th>
                <th style={{ padding: "10px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>GAPS</th>
                <th style={{ padding: "10px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>QUICK WINS</th>
                <th style={{ padding: "10px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "12px 14px", fontSize: "0.8125rem", color: "#0F172A", fontWeight: "600" }}>
                  7/20/2026, 3:30:49 PM
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{ fontSize: "0.6875rem", padding: "2px 8px", borderRadius: "4px", background: "#DCFCE7", color: "#15803D", fontWeight: "700" }}>
                    complete
                  </span>
                </td>
                <td style={{ padding: "12px 14px", fontSize: "0.8125rem", color: "#475569" }}>74</td>
                <td style={{ padding: "12px 14px", fontSize: "0.8125rem", color: "#475569" }}>142</td>
                <td style={{ padding: "12px 14px", fontSize: "0.8125rem", color: "#475569" }}>47</td>
                <td style={{ padding: "12px 14px", fontSize: "0.8125rem", color: "#475569" }}>0</td>
                <td style={{ padding: "12px 14px", textAlign: "right" }}>
                  <button
                    onClick={() => success("Opening 47 competitor keyword gap opportunities")}
                    style={{
                      padding: "4px 14px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#FFFFFF",
                      background: "#6366F1",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Open
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
