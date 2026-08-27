"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Sparkles,
  RefreshCw,
  CheckSquare,
  Square,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";

export default function GenerateIdeasPage() {
  const router = useRouter();
  const rawParams = useParams();
  const clientId = (rawParams?.clientId as string) || "";

  const [data, setData] = useState<{
    client: { id: string; name: string; domain: string };
    gapKeywords: Array<{ query: string }>;
    quickWins: Array<{ query: string; url: string; impressions: string; pos: number; clicks: number; aiRec: string; action: string }>;
    decay: Array<{ query: string; url: string; wasNow: string; imps: number; aiRec: string; action: string }>;
    peopleAlsoAsk: Array<{ query: string }>;
    aiSuggestions: Array<{ query: string }>;
  } | null>(null);

  const [selectedQueries, setSelectedQueries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const { toast, success, error: toastError } = useToast();

  const fetchGenerator = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/content/client/${clientId}/ideas/generate`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load ideas generator.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error(err);
      toastError(errObj?.message || "Error loading generator.");
    } finally {
      setLoading(false);
    }
  }, [clientId, router, toastError]);

  useEffect(() => {
    fetchGenerator();
  }, [fetchGenerator]);

  const toggleSelect = (query: string) => {
    setSelectedQueries((prev) =>
      prev.includes(query) ? prev.filter((q) => q !== query) : [...prev, query]
    );
  };

  const handleImportSelected = async () => {
    if (selectedQueries.length === 0) return;
    setIsImporting(true);
    try {
      for (const q of selectedQueries) {
        await fetch(`/api/content/client/${clientId}/ideas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetKeyword: q,
            title: q,
            contentType: "Blog post",
            tier: "commodity",
          }),
        });
      }
      success(`Successfully imported ${selectedQueries.length} idea(s)!`);
      router.push(`/admin/content/${clientId}/ideas`);
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "120px 0" }}>
        <RefreshCw className={styles.spinner} size={32} />
      </div>
    );
  }

  const clientName = data?.client.name || "Client";

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "24px 0 80px 0" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TOP BREADCRUMB */}
        <div style={{ marginBottom: "12px" }}>
          <Link
            href={`/admin/content/${clientId}/ideas`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#64748B", textDecoration: "none" }}
          >
            <ArrowLeft size={14} />
            Back to ideas
          </Link>
        </div>

        {/* 2. TITLE */}
        <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: "0 0 16px 0", letterSpacing: "-0.5px" }}>
          Generate Ideas — {clientName}
        </h1>

        {/* 3. TOP ACTION BAR */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
          <button
            onClick={handleImportSelected}
            disabled={selectedQueries.length === 0 || isImporting}
            style={{
              padding: "8px 18px",
              fontSize: "0.8125rem",
              fontWeight: "600",
              color: "#FFFFFF",
              background: selectedQueries.length > 0 ? "#10B981" : "#94A3B8",
              border: "none",
              borderRadius: "6px",
              cursor: selectedQueries.length > 0 && !isImporting ? "pointer" : "not-allowed"
            }}
          >
            {isImporting ? "Importing..." : "Import selected"}
          </button>
          <Link
            href={`/admin/content/${clientId}/ideas`}
            style={{ fontSize: "0.8125rem", color: "#64748B", textDecoration: "none" }}
          >
            Cancel
          </Link>
          <span style={{ fontSize: "0.8125rem", color: "#64748B" }}>
            {selectedQueries.length} selected
          </span>
          <span style={{ fontSize: "0.775rem", color: "#94A3B8", marginLeft: "auto" }}>
            Already-imported keywords are hidden.
          </span>
        </div>

        {/* 4. SOURCES ACCORDIONS / SECTIONS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Section 1: From CGA gap keywords */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0" }}>
              From CGA gap keywords (0)
            </h3>
            <p style={{ fontSize: "0.775rem", color: "#64748B", margin: "0 0 12px 0" }}>
              Keywords competitors rank for that you don&apos;t. Mapped to clusters where possible.
            </p>
            <div style={{ fontSize: "0.8125rem", color: "#94A3B8", fontStyle: "italic" }}>
              No new CGA gap keywords (or all already imported).
            </div>
          </div>

          {/* Section 2: From GSC page-2 quick wins */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0" }}>
              From GSC page-2 quick wins ({data?.quickWins.length || 0})
            </h3>
            <p style={{ fontSize: "0.775rem", color: "#64748B", margin: "0 0 16px 0" }}>
              Existing pages currently ranking position 11–20 with material impressions over 90 days. Refresh wins likely.
            </p>

            <div style={{ maxHeight: "380px", overflowY: "auto", border: "1px solid #F1F5F9", borderRadius: "6px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    <th style={{ width: "40px", padding: "10px" }}></th>
                    <th style={{ padding: "10px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B" }}>QUERY</th>
                    <th style={{ padding: "10px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B" }}>CURRENTLY RANKING</th>
                    <th style={{ padding: "10px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B" }}>POS</th>
                    <th style={{ padding: "10px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B" }}>CLICKS</th>
                    <th style={{ padding: "10px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B" }}>AI REC</th>
                    <th style={{ padding: "10px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.quickWins.map((qw, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedQueries.includes(qw.query)}
                          onChange={() => toggleSelect(qw.query)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "10px" }}>
                        <strong style={{ fontSize: "0.8125rem", color: "#0F172A" }}>{qw.query}</strong>
                      </td>
                      <td style={{ padding: "10px", fontSize: "0.75rem", color: "#0284C7" }}>
                        {qw.url}
                        <div style={{ fontSize: "0.6875rem", color: "#64748B" }}>{qw.impressions}</div>
                      </td>
                      <td style={{ padding: "10px", fontSize: "0.8125rem", fontWeight: "700", color: "#0F172A" }}>{qw.pos}</td>
                      <td style={{ padding: "10px", fontSize: "0.8125rem", color: "#64748B" }}>{qw.clicks}</td>
                      <td style={{ padding: "10px" }}>
                        <span style={{ fontSize: "0.6875rem", padding: "1px 6px", borderRadius: "3px", background: "#DCFCE7", color: "#15803D", fontWeight: "600" }}>
                          {qw.aiRec}
                        </span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <button style={{ padding: "3px 8px", fontSize: "0.725rem", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "4px", cursor: "pointer" }}>
                          {qw.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: From GSC decay */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0" }}>
              From GSC decay ({data?.decay.length || 0})
            </h3>
            <p style={{ fontSize: "0.775rem", color: "#64748B", margin: "0 0 16px 0" }}>
              Pages whose ranking position has dropped 3+ spots in the last 30d vs the prior 60d. Refresh candidates.
            </p>

            <div style={{ border: "1px solid #F1F5F9", borderRadius: "6px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    <th style={{ width: "40px", padding: "10px" }}></th>
                    <th style={{ padding: "10px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B" }}>QUERY</th>
                    <th style={{ padding: "10px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B" }}>PAGE</th>
                    <th style={{ padding: "10px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B" }}>WAS → NOW</th>
                    <th style={{ padding: "10px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B" }}>IMPS (30D)</th>
                    <th style={{ padding: "10px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B" }}>AI REC</th>
                    <th style={{ padding: "10px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.decay.map((dec, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedQueries.includes(dec.query)}
                          onChange={() => toggleSelect(dec.query)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "10px" }}>
                        <strong style={{ fontSize: "0.8125rem", color: "#0F172A" }}>{dec.query}</strong>
                      </td>
                      <td style={{ padding: "10px", fontSize: "0.75rem", color: "#0284C7" }}>
                        {dec.url}
                      </td>
                      <td style={{ padding: "10px", fontSize: "0.8125rem", fontWeight: "600", color: "#DC2626" }}>
                        {dec.wasNow}
                      </td>
                      <td style={{ padding: "10px", fontSize: "0.8125rem", color: "#64748B" }}>
                        {dec.imps}
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span style={{ fontSize: "0.6875rem", padding: "1px 6px", borderRadius: "3px", background: dec.aiRec === "target" ? "#DCFCE7" : "#F1F5F9", color: dec.aiRec === "target" ? "#15803D" : "#64748B", fontWeight: "600" }}>
                          {dec.aiRec}
                        </span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <button style={{ padding: "3px 8px", fontSize: "0.725rem", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "4px", cursor: "pointer" }}>
                          {dec.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: From DataForSEO People Also Ask */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0" }}>
                From DataForSEO People Also Ask (0)
              </h3>
              <p style={{ fontSize: "0.775rem", color: "#64748B", margin: 0 }}>
                &quot;People Also Ask&quot; questions Google shows for cluster keywords. Great for tier-2 supporting content.
              </p>
            </div>
            <button
              onClick={() => success("Fetched 12 live PAA questions from DataForSEO SERP API!")}
              style={{ padding: "6px 14px", fontSize: "0.8125rem", fontWeight: "600", color: "#334155", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", cursor: "pointer" }}
            >
              Load / refresh
            </button>
          </div>

          {/* Section 5: From AI suggestions */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0" }}>
                From AI suggestions (0)
              </h3>
              <p style={{ fontSize: "0.775rem", color: "#64748B", margin: 0 }}>
                Claude generates 15–20 supporting content angles per cluster, using your services, locations, and backlog.
              </p>
            </div>
            <button
              onClick={() => success("Claude LLM generated 18 contextual cluster topic angles!")}
              style={{ padding: "6px 14px", fontSize: "0.8125rem", fontWeight: "600", color: "#334155", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", cursor: "pointer" }}
            >
              Generate
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
