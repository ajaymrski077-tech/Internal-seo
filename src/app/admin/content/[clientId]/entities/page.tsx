"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Trash2,
  RefreshCw,
  Plus
} from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";

interface EntityItem {
  id: string;
  name: string;
  category: string | null;
  notes: string | null;
  isBlocklist: boolean;
}

export default function ContentEntitiesPage() {
  const router = useRouter();
  const rawParams = useParams();
  const clientId = (rawParams?.clientId as string) || "";

  const [allowlist, setAllowlist] = useState<EntityItem[]>([]);
  const [blocklist, setBlocklist] = useState<EntityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Allowlist inputs
  const [allowName, setAllowName] = useState("");
  const [allowCat, setAllowCat] = useState("");
  const [allowNotes, setAllowNotes] = useState("");

  // Blocklist inputs
  const [blockName, setBlockName] = useState("");
  const [blockCat, setBlockCat] = useState("");
  const [blockNotes, setBlockNotes] = useState("");

  const { toast, success, error: toastError } = useToast();

  const fetchEntities = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/content/client/${clientId}/entities`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load entities.");
      }
      const json = await res.json();
      setAllowlist(json.allowlist || []);
      setBlocklist(json.blocklist || []);
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error(err);
      toastError(errObj?.message || "Error loading entities.");
    } finally {
      setLoading(false);
    }
  }, [clientId, router, toastError]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const handleAddAllowlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowName) return;
    try {
      const res = await fetch(`/api/content/client/${clientId}/entities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: allowName,
          category: allowCat || undefined,
          notes: allowNotes || undefined,
          isBlocklist: false,
        }),
      });
      if (!res.ok) throw new Error("Failed to add allowlist entity.");
      success("Allowlist entity added!");
      setAllowName("");
      setAllowCat("");
      setAllowNotes("");
      fetchEntities();
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Error adding entity.");
    }
  };

  const handleAddBlocklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockName) return;
    try {
      const res = await fetch(`/api/content/client/${clientId}/entities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: blockName,
          category: blockCat || undefined,
          notes: blockNotes || undefined,
          isBlocklist: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to add blocklist entity.");
      success("Blocklist entity added!");
      setBlockName("");
      setBlockCat("");
      setBlockNotes("");
      fetchEntities();
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Error adding entity.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/content/client/${clientId}/entities?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete entity.");
      success("Entity removed.");
      fetchEntities();
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Delete failed.");
    }
  };

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "24px 0 80px 0" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TOP BREADCRUMB */}
        <div style={{ marginBottom: "12px" }}>
          <Link
            href={`/admin/content/${clientId}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#64748B", textDecoration: "none" }}
          >
            <ArrowLeft size={14} />
            Back to Altitude Roofing
          </Link>
        </div>

        {/* 2. HEADER */}
        <div style={{ marginBottom: "18px" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
            Entities for Altitude Roofing
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
            Used by the brief and critique to enforce coverage and exclusion of specific named entities.
          </p>
        </div>

        {/* 3. INFO CALLOUT */}
        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "8px", padding: "14px 18px", marginBottom: "24px", fontSize: "0.775rem", color: "#1E40AF", lineHeight: "1.5" }}>
          <strong>Allowlist:</strong> entities you want surfaced to the writer where relevant (your own product names, methodologies you champion). High priority even if they don&apos;t appear in competitor content.<br />
          <strong>Blocklist:</strong> entities to exclude from briefs and drafts. SERP top 10 domains for any given keyword are blocked automatically; only add things here that should always be excluded for this client (competitor brands you compete with directly, affiliate relationships you&apos;d rather not surface).
        </div>

        {/* 4. ALLOWLIST CARD */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A", margin: "0 0 2px 0" }}>
            Allowlist
          </h3>
          <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "0 0 16px 0" }}>
            Always include where contextually relevant.
          </p>

          {allowlist.length === 0 ? (
            <div style={{ fontSize: "0.8125rem", color: "#94A3B8", textAlign: "center", padding: "16px 0" }}>
              No allowlist entries yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {allowlist.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px" }}>
                  <div>
                    <strong style={{ fontSize: "0.8125rem", color: "#0F172A" }}>{item.name}</strong>
                    {item.category && <span style={{ fontSize: "0.725rem", color: "#64748B", marginLeft: "8px" }}>({item.category})</span>}
                  </div>
                  <button onClick={() => handleDelete(item.id)} style={{ background: "transparent", border: "none", color: "#DC2626", cursor: "pointer" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddAllowlist} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Entity (e.g. Arken Method)"
              value={allowName}
              onChange={(e) => setAllowName(e.target.value)}
              style={{ flex: 2, minWidth: "160px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", outline: "none" }}
            />
            <select
              value={allowCat}
              onChange={(e) => setAllowCat(e.target.value)}
              style={{ flex: 1, minWidth: "120px", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", color: "#334155" }}
            >
              <option value="">-- Category --</option>
              <option value="Methodology">Methodology</option>
              <option value="Product">Product</option>
              <option value="Brand Concept">Brand Concept</option>
            </select>
            <input
              type="text"
              placeholder="Notes (optional)"
              value={allowNotes}
              onChange={(e) => setAllowNotes(e.target.value)}
              style={{ flex: 2, minWidth: "140px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", outline: "none" }}
            />
            <button
              type="submit"
              style={{ padding: "8px 18px", fontSize: "0.8125rem", fontWeight: "600", color: "#FFFFFF", background: "#10B981", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              Add
            </button>
          </form>
        </div>

        {/* 5. BLOCKLIST CARD */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A", margin: "0 0 2px 0" }}>
            Blocklist
          </h3>
          <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "0 0 16px 0" }}>
            Never surface to the writer or include in briefs.
          </p>

          {blocklist.length === 0 ? (
            <div style={{ fontSize: "0.8125rem", color: "#94A3B8", textAlign: "center", padding: "16px 0" }}>
              No blocklist entries yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {blocklist.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px" }}>
                  <div>
                    <strong style={{ fontSize: "0.8125rem", color: "#0F172A" }}>{item.name}</strong>
                    {item.category && <span style={{ fontSize: "0.725rem", color: "#64748B", marginLeft: "8px" }}>({item.category})</span>}
                  </div>
                  <button onClick={() => handleDelete(item.id)} style={{ background: "transparent", border: "none", color: "#DC2626", cursor: "pointer" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddBlocklist} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Entity (e.g. Competitor X)"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              style={{ flex: 2, minWidth: "160px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", outline: "none" }}
            />
            <select
              value={blockCat}
              onChange={(e) => setBlockCat(e.target.value)}
              style={{ flex: 1, minWidth: "120px", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", color: "#334155" }}
            >
              <option value="">-- Category --</option>
              <option value="Direct Competitor">Direct Competitor</option>
              <option value="Banned Keyword">Banned Keyword</option>
              <option value="Disallowed Topic">Disallowed Topic</option>
            </select>
            <input
              type="text"
              placeholder="Notes (optional)"
              value={blockNotes}
              onChange={(e) => setBlockNotes(e.target.value)}
              style={{ flex: 2, minWidth: "140px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", outline: "none" }}
            />
            <button
              type="submit"
              style={{ padding: "8px 18px", fontSize: "0.8125rem", fontWeight: "600", color: "#FFFFFF", background: "#DC2626", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              Add
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
