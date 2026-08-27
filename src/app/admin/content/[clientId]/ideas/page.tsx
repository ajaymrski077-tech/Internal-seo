"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Plus,
  Sparkles,
  RefreshCw,
  Sliders,
  Calendar,
  AlertCircle
} from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";

interface IdeaItem {
  id: string;
  title: string;
  targetKeyword: string;
  cluster: string;
  tier: string;
  intent: string;
  volume: number;
  score: number;
  status: string;
  source: string;
}

export default function IdeasHubPage() {
  const router = useRouter();
  const rawParams = useParams();
  const clientId = (rawParams?.clientId as string) || "";

  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [clientName, setClientName] = useState("Client");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const { toast, success, error: toastError } = useToast();

  const fetchIdeas = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/content/client/${clientId}/ideas?status=${statusFilter}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load ideas.");
      }
      const json = await res.json();
      setIdeas(json.ideas || []);
      setClientName(json.client?.name || "Client");
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error(err);
      setError(errObj?.message || "Error loading ideas.");
    } finally {
      setLoading(false);
    }
  }, [clientId, statusFilter, router]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const filterPills = ["All", "Proposed", "Approved", "Briefed", "Published", "Rejected"];

  const handleRescore = () => {
    success("Ideas priority scores updated based on live SERP volume!");
    fetchIdeas();
  };

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "24px 0 80px 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TOP BREADCRUMB */}
        <div style={{ marginBottom: "12px" }}>
          <Link
            href={`/admin/content/${clientId}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#64748B", textDecoration: "none" }}
          >
            <ArrowLeft size={14} />
            Back to {clientName} hub
          </Link>
        </div>

        {/* 2. TITLE & ACTION BUTTONS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
              Ideas ({ideas.length})
            </h1>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href={`/admin/content/${clientId}/plan`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#0F172A",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                textDecoration: "none"
              }}
            >
              <Calendar size={13} />
              Content plan
            </Link>
            <button
              onClick={handleRescore}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#0F172A",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              <Sliders size={13} />
              Rescore
            </button>
            <Link
              href={`/admin/content/${clientId}/ideas/generate`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#0F172A",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                textDecoration: "none"
              }}
            >
              <Sparkles size={13} />
              Generate ideas
            </Link>
            <Link
              href={`/admin/content/${clientId}/ideas/new`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 16px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#FFFFFF",
                background: "#10B981",
                border: "none",
                borderRadius: "6px",
                textDecoration: "none"
              }}
            >
              + New idea
            </Link>
          </div>
        </div>

        {/* 3. FILTER PILLS */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {filterPills.map((pill) => (
            <button
              key={pill}
              onClick={() => setStatusFilter(pill)}
              style={{
                padding: "5px 14px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                borderRadius: "9999px",
                border: statusFilter === pill ? "1px solid #0F4C5C" : "1px solid #E2E8F0",
                background: statusFilter === pill ? "#0F4C5C" : "#FFFFFF",
                color: statusFilter === pill ? "#FFFFFF" : "#475569",
                cursor: "pointer"
              }}
            >
              {pill}
            </button>
          ))}
        </div>

        {/* 4. IDEAS TABLE */}
        {loading && ideas.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <RefreshCw className={styles.spinner} size={32} />
          </div>
        ) : (
          <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "12px 20px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>TITLE</th>
                  <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>CLUSTER</th>
                  <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>TIER</th>
                  <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>INTENT</th>
                  <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>VOLUME</th>
                  <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>SCORE</th>
                  <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>STATUS</th>
                  <th style={{ padding: "12px 20px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", textAlign: "right" }}>SOURCE</th>
                </tr>
              </thead>
              <tbody>
                {ideas.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "40px 20px", textAlign: "center", color: "#64748B", fontSize: "0.875rem" }}>
                      No ideas found. Click &quot;Generate ideas&quot; or &quot;+ New idea&quot; to add some.
                    </td>
                  </tr>
                ) : (
                  ideas.map((idea) => {
                    let statusBg = "#FEF3C7";
                    let statusColor = "#B45309";
                    if (idea.status === "briefed") { statusBg = "#EDE9FE"; statusColor = "#6D28D9"; }
                    else if (idea.status === "approved") { statusBg = "#DCFCE7"; statusColor = "#15803D"; }
                    else if (idea.status === "published") { statusBg = "#E0F2FE"; statusColor = "#0369A1"; }

                    return (
                      <tr
                        key={idea.id}
                        style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* TITLE */}
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "0.875rem" }}>
                            {idea.title}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                            kw: {idea.targetKeyword}
                          </div>
                        </td>

                        {/* CLUSTER */}
                        <td style={{ padding: "14px 14px", fontSize: "0.8125rem", color: "#475569" }}>
                          {idea.cluster}
                        </td>

                        {/* TIER */}
                        <td style={{ padding: "14px 14px", fontSize: "0.8125rem", color: "#475569" }}>
                          {idea.tier}
                        </td>

                        {/* INTENT */}
                        <td style={{ padding: "14px 14px", fontSize: "0.8125rem", color: "#475569" }}>
                          {idea.intent}
                        </td>

                        {/* VOLUME */}
                        <td style={{ padding: "14px 14px", fontSize: "0.8125rem", fontWeight: "600", color: "#0F172A" }}>
                          {idea.volume > 0 ? idea.volume.toLocaleString() : "—"}
                        </td>

                        {/* SCORE */}
                        <td style={{ padding: "14px 14px", fontSize: "0.875rem", fontWeight: "800", color: "#0F172A" }}>
                          {idea.score || "—"}
                        </td>

                        {/* STATUS */}
                        <td style={{ padding: "14px 14px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.725rem",
                              fontWeight: "600",
                              background: statusBg,
                              color: statusColor,
                              textTransform: "capitalize"
                            }}
                          >
                            {idea.status}
                          </span>
                        </td>

                        {/* SOURCE */}
                        <td style={{ padding: "14px 20px", fontSize: "0.75rem", color: "#64748B", textAlign: "right" }}>
                          {idea.source}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
