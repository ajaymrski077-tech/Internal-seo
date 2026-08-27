"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  User,
  Upload,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";

interface ScheduledPiece {
  id: string;
  title: string;
  targetKeyword: string;
  contentType: string | null;
  scheduledDate: string | null;
  dueDate: string | null;
  assignedTo: string | null;
}

interface MonthPlan {
  key: string;
  label: string;
  pieces: ScheduledPiece[];
}

export default function ContentPlanPage() {
  const router = useRouter();
  const rawParams = useParams();
  const clientId = (rawParams?.clientId as string) || "";

  const [months, setMonths] = useState<MonthPlan[]>([]);
  const [unassigned, setUnassigned] = useState<ScheduledPiece[]>([]);
  const [clientName, setClientName] = useState("Client");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Inline adder state
  const [activeAddMonth, setActiveAddMonth] = useState<string | null>(null);
  const [newPieceTitle, setNewPieceTitle] = useState("");
  const [newPieceKeyword, setNewPieceKeyword] = useState("");

  // Text plan import
  const [importText, setImportText] = useState("");

  const { toast, success, error: toastError } = useToast();

  const fetchPlan = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/content/client/${clientId}/plan`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load content plan.");
      }
      const json = await res.json();
      setMonths(json.months || []);
      setUnassigned(json.unassigned || []);
      setClientName(json.client?.name || "Client");
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error(err);
      setError(errObj?.message || "Error loading plan.");
    } finally {
      setLoading(false);
    }
  }, [clientId, router]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleScheduleUnassigned = async (pieceId: string, monthKey: string) => {
    try {
      const date = `${monthKey}-15`;
      const res = await fetch(`/api/content/client/${clientId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: pieceId, scheduledDate: date }),
      });
      if (!res.ok) throw new Error("Failed to schedule piece.");
      success("Piece scheduled!");
      fetchPlan();
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Error scheduling piece.");
    }
  };

  const handleCreateAndSchedule = async (monthKey: string) => {
    if (!newPieceKeyword) return;
    try {
      const date = `${monthKey}-15`;
      const res = await fetch(`/api/content/client/${clientId}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKeyword: newPieceKeyword,
          title: newPieceTitle || newPieceKeyword,
          contentType: "Blog post",
        }),
      });
      if (!res.ok) throw new Error("Failed to create idea.");
      const json = await res.json();
      await fetch(`/api/content/client/${clientId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: json.idea.id, scheduledDate: date }),
      });
      success("Piece created and scheduled!");
      setActiveAddMonth(null);
      setNewPieceKeyword("");
      setNewPieceTitle("");
      fetchPlan();
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Error adding piece.");
    }
  };

  if (loading && months.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "120px 0" }}>
        <RefreshCw className={styles.spinner} size={32} />
      </div>
    );
  }

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "24px 0 80px 0" }}>
      <div style={{ maxWidth: "1050px", margin: "0 auto", padding: "0 24px" }}>
        
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

        {/* 2. HEADER */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
            Content plan
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
            Planned deliverable calendar & monthly targets for {clientName}.
          </p>
        </div>

        {/* 3. MONTH BY MONTH PLANNING BLOCKS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
          {months.map((m) => (
            <div
              key={m.key}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "20px 24px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "1rem", fontWeight: "700", color: "#0F172A" }}>
                  {m.label}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                  {m.pieces.length} {m.pieces.length === 1 ? "piece" : "pieces"}
                </span>
              </div>

              {/* Scheduled Pieces in this month */}
              {m.pieces.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                  {m.pieces.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: "6px",
                        padding: "10px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.875rem", color: "#0F172A" }}>{p.title}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>kw: {p.targetKeyword}</div>
                      </div>
                      <span style={{ fontSize: "0.725rem", padding: "2px 6px", borderRadius: "4px", background: "#E0F2FE", color: "#0369A1", fontWeight: "600" }}>
                        Scheduled
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "0.8125rem", color: "#94A3B8", marginBottom: "12px" }}>
                  Nothing planned yet
                </div>
              )}

              {/* Inline Add Button or Form */}
              {activeAddMonth === m.key ? (
                <div style={{ background: "#F1F5F9", padding: "12px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="Target keyword (e.g. slate vs tile roof)"
                    value={newPieceKeyword}
                    onChange={(e) => setNewPieceKeyword(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", outline: "none" }}
                  />
                  <input
                    type="text"
                    placeholder="Article title (optional)"
                    value={newPieceTitle}
                    onChange={(e) => setNewPieceTitle(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", outline: "none" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setActiveAddMonth(null)}
                      style={{ padding: "6px 12px", fontSize: "0.775rem", color: "#475569", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateAndSchedule(m.key)}
                      style={{ padding: "6px 14px", fontSize: "0.775rem", fontWeight: "600", color: "#FFFFFF", background: "#0F4C5C", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Add to {m.label}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveAddMonth(m.key)}
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: "600",
                    color: "#0F4C5C",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  + Add a piece to this month
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 4. UNASSIGNED IDEAS BACKLOG */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "#0F172A", margin: "0 0 14px 0" }}>
            Unassigned Ideas Backlog ({unassigned.length})
          </h3>

          {unassigned.length === 0 ? (
            <div style={{ fontSize: "0.8125rem", color: "#94A3B8" }}>
              All ideas have been assigned to monthly schedules.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {unassigned.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "6px"
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "0.875rem", color: "#0F172A" }}>{item.title}</strong>
                    <div style={{ fontSize: "0.75rem", color: "#64748B" }}>kw: {item.targetKeyword}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) handleScheduleUnassigned(item.id, e.target.value);
                      }}
                      style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid #CBD5E1", fontSize: "0.775rem", color: "#334155" }}
                    >
                      <option value="" disabled>Schedule into month...</option>
                      {months.map((m) => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
