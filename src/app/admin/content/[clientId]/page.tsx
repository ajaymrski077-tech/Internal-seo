"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Plus,
  Eye,
  Search,
  ExternalLink,
  RefreshCw,
  FileText,
  Lightbulb,
  Calendar,
  Layers,
  Tag,
  Settings,
  X
} from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";

interface ContentPiece {
  id: string;
  title: string;
  targetKeyword: string;
  contentType: string | null;
  stage: string;
  status: string;
  tier: string | null;
  wordCount: number | null;
  publishDate: string | null;
  dueDate: string | null;
  createdAt: string;
}

interface PipelinePayload {
  client: {
    id: string;
    name: string;
    domain: string;
  };
  totalPieces: number;
  kanban: {
    planned: ContentPiece[];
    brief: ContentPiece[];
    drafted: ContentPiece[];
    editing: ContentPiece[];
    review: ContentPiece[];
    publish: ContentPiece[];
    published: ContentPiece[];
  };
}

export default function ClientPipelinePage() {
  const router = useRouter();
  const rawParams = useParams();
  const clientId = (rawParams?.clientId as string) || "";

  const [data, setData] = useState<PipelinePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Add piece modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("Blog post");
  const [tier, setTier] = useState("commodity");
  const [isAdding, setIsAdding] = useState(false);

  const { toast, success, error: toastError } = useToast();

  const fetchPipeline = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/content/client/${clientId}/pipeline?search=${encodeURIComponent(search)}&type=${typeFilter}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load content pipeline.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error(err);
      setError(errObj?.message || "Error loading pipeline.");
    } finally {
      setLoading(false);
    }
  }, [clientId, search, typeFilter, router]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const handleAddPiece = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/content/client/${clientId}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKeyword: keyword,
          title: title || keyword,
          contentType,
          tier,
        }),
      });
      if (!res.ok) throw new Error("Failed to create piece.");
      success("Piece added to pipeline!");
      setIsAddOpen(false);
      setKeyword("");
      setTitle("");
      fetchPipeline();
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Error adding piece.");
    } finally {
      setIsAdding(false);
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
  const domain = data?.client.domain || "example.com";

  const columns = [
    { key: "planned" as const, title: "1. Planned", items: data?.kanban.planned || [] },
    { key: "brief" as const, title: "2. Brief", items: data?.kanban.brief || [] },
    { key: "drafted" as const, title: "3. Drafted", items: data?.kanban.drafted || [] },
    { key: "editing" as const, title: "4. Editing", items: data?.kanban.editing || [] },
    { key: "review" as const, title: "5. Client review", items: data?.kanban.review || [] },
    { key: "publish" as const, title: "6. Publish", items: data?.kanban.publish || [] },
    { key: "published" as const, title: "7. Published", items: data?.kanban.published || [] },
  ];

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "24px 0 80px 0" }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TOP BREADCRUMB */}
        <div style={{ marginBottom: "12px" }}>
          <Link
            href="/admin/content"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#64748B", textDecoration: "none" }}
          >
            <ArrowLeft size={14} />
            Back to Content
          </Link>
        </div>

        {/* 2. HEADER & TOP ACTIONS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
              {clientName} — pipeline
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
              Production pipeline & strategy deck — essential for human briefing.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href={`/admin/content/${clientId}/preview`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#0F172A",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                textDecoration: "none",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
              }}
            >
              <Eye size={14} />
              View as client
            </Link>
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

        {/* 3. SUB-NAVIGATION BAR */}
        <div style={{ display: "flex", gap: "18px", borderBottom: "1px solid #E2E8F0", marginBottom: "20px", flexWrap: "wrap" }}>
          <Link
            href={`/admin/content/${clientId}`}
            style={{ padding: "8px 4px 12px 4px", fontSize: "0.875rem", fontWeight: "700", color: "#0F4C5C", textDecoration: "none", borderBottom: "2px solid #0F4C5C" }}
          >
            📋 Overview
          </Link>
          <Link
            href={`/admin/content/${clientId}/ideas`}
            style={{ padding: "8px 4px 12px 4px", fontSize: "0.875rem", fontWeight: "500", color: "#64748B", textDecoration: "none" }}
          >
            💡 Ideas hub
          </Link>
          <Link
            href={`/admin/content/${clientId}/plan`}
            style={{ padding: "8px 4px 12px 4px", fontSize: "0.875rem", fontWeight: "500", color: "#64748B", textDecoration: "none" }}
          >
            📅 Monthly plan
          </Link>
          <Link
            href={`/admin/content/${clientId}/templates`}
            style={{ padding: "8px 4px 12px 4px", fontSize: "0.875rem", fontWeight: "500", color: "#64748B", textDecoration: "none" }}
          >
            📄 Page templates
          </Link>
          <Link
            href={`/admin/content/${clientId}/entities`}
            style={{ padding: "8px 4px 12px 4px", fontSize: "0.875rem", fontWeight: "500", color: "#64748B", textDecoration: "none" }}
          >
            🏷️ Entities
          </Link>
          <Link
            href={`/admin/content/${clientId}/settings`}
            style={{ padding: "8px 4px 12px 4px", fontSize: "0.875rem", fontWeight: "500", color: "#64748B", textDecoration: "none" }}
          >
            ⚙️ Settings
          </Link>
        </div>

        {/* 4. FILTER BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative", width: "260px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
              <input
                type="text"
                placeholder="Search by title, keyword, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", padding: "7px 10px 7px 30px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#FFFFFF", fontSize: "0.8125rem", outline: "none" }}
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#FFFFFF", fontSize: "0.8125rem", color: "#334155", outline: "none" }}
            >
              <option value="ALL">All types</option>
              <option value="Blog post">Blog post</option>
              <option value="Comparison">Comparison</option>
              <option value="FAQ">FAQ</option>
              <option value="Service page">Service page</option>
            </select>
          </div>

          <div style={{ fontSize: "0.8125rem", color: "#64748B" }}>
            {data?.totalPieces || 0} pieces
          </div>
        </div>

        {/* 5. 7-COLUMN PRODUCTION KANBAN BOARD */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px", alignItems: "start", marginBottom: "40px" }}>
          {columns.map((col) => (
            <div
              key={col.key}
              style={{
                background: "#F1F5F9",
                borderRadius: "8px",
                padding: "10px",
                minHeight: "450px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 4px 6px 4px", borderBottom: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#334155" }}>
                  {col.title}
                </span>
                <span style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", background: "#E2E8F0", padding: "1px 5px", borderRadius: "9999px" }}>
                  {col.items.length}
                </span>
              </div>

              {/* Column Cards List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", maxHeight: "600px" }}>
                {col.items.length === 0 ? (
                  <div style={{ fontSize: "0.725rem", color: "#94A3B8", textAlign: "center", padding: "24px 0" }}>
                    No pieces
                  </div>
                ) : (
                  col.items.map((piece) => (
                    <div
                      key={piece.id}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "6px",
                        padding: "10px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px"
                      }}
                    >
                      <div style={{ fontSize: "0.8125rem", fontWeight: "700", color: "#0F172A", lineHeight: "1.3" }}>
                        {piece.title}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                        kw: {piece.targetKeyword}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F8FAFC", paddingTop: "6px", marginTop: "2px" }}>
                        <span style={{ fontSize: "0.65rem", padding: "1px 5px", borderRadius: "3px", background: "#F1F5F9", color: "#475569", textTransform: "capitalize" }}>
                          {piece.contentType || "Blog post"}
                        </span>
                        <span style={{ fontSize: "0.6875rem", color: "#94A3B8" }}>
                          {piece.wordCount ? `${piece.wordCount}w` : "1.2kw"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 6. LOWER STRATEGY SECTIONS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Strategy Deck */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "24px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "#0F172A", margin: "0 0 12px 0" }}>
              Strategy Deck
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "#475569", lineHeight: "1.5", margin: 0 }}>
              Primary search territory targets local commercial service queries in the Edinburgh area.
              Priority emphasis on high-intent terms (&quot;roof repair&quot;, &quot;chimney repair&quot;, &quot;gutter replacement&quot;), followed by supporting guide content around common homeowner questions.
            </p>
          </div>

          {/* Content Strategy & Pillars */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "24px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "#0F172A", margin: "0 0 12px 0" }}>
              Content Pillars
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8125rem", color: "#475569" }}>
              <div>• <strong>Pillar 1: Emergency & Roof Repairs</strong> (Commercial service landing pages)</div>
              <div>• <strong>Pillar 2: Chimney & Leadwork</strong> (High-ticket structural repair solutions)</div>
              <div>• <strong>Pillar 3: Homeowner Guides & Diagnostics</strong> (Topical authority & linkable assets)</div>
            </div>
          </div>
        </div>

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
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0F172A", margin: 0 }}>Add Piece to Pipeline</h3>
                <button onClick={() => setIsAddOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddPiece} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Target Keyword *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. chimney repair edinburgh"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Top Chimney Repair Services in Edinburgh"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                      Content Type
                    </label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                    >
                      <option>Blog post</option>
                      <option>Comparison</option>
                      <option>FAQ</option>
                      <option>Service page</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                      Tier
                    </label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                    >
                      <option value="commodity">Commodity</option>
                      <option value="enhanced">Enhanced</option>
                      <option value="story">Story</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
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
                    {isAdding ? "Adding..." : "Add Piece"}
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
