"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  X
} from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";

interface TemplateItem {
  id: string;
  name: string;
  source: string;
  sectionsCount: number;
  wordCount: number;
  usedByCount: number;
  createdAt: string;
}

export default function PageTemplatesPage() {
  const router = useRouter();
  const rawParams = useParams();
  const clientId = (rawParams?.clientId as string) || "";

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [source, setSource] = useState("IMAGE");
  const [sectionsCount, setSectionsCount] = useState(10);
  const [wordCount, setWordCount] = useState(1330);
  const [isSaving, setIsSaving] = useState(false);

  const { toast, success, error: toastError } = useToast();

  const fetchTemplates = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/content/client/${clientId}/templates`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load templates.");
      }
      const json = await res.json();
      setTemplates(json.templates || []);
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error(err);
      toastError(errObj?.message || "Error loading templates.");
    } finally {
      setLoading(false);
    }
  }, [clientId, router, toastError]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/content/client/${clientId}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, source, sectionsCount, wordCount }),
      });
      if (!res.ok) throw new Error("Failed to create template.");
      success("Page template created!");
      setIsModalOpen(false);
      setName("");
      fetchTemplates();
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Failed to create template.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this page template?")) return;
    try {
      const res = await fetch(`/api/content/client/${clientId}/templates?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete template.");
      success("Template deleted.");
      fetchTemplates();
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Delete failed.");
    }
  };

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "24px 0 80px 0" }}>
      <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TOP BREADCRUMB */}
        <div style={{ marginBottom: "12px" }}>
          <Link
            href={`/admin/content/${clientId}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#64748B", textDecoration: "none" }}
          >
            <ArrowLeft size={14} />
            Back to Altitude Roofing hub
          </Link>
        </div>

        {/* 2. HEADER & ACTION */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Page templates: Altitude Roofing
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "#64748B", maxWidth: "800px", lineHeight: "1.4", margin: 0 }}>
              Templates capture the structural pattern of an existing service page (sections, order, word distribution) and let you reuse it across multiple service-page ideas. Useful when you have a layout that works — upload a screenshot or paste a URL once, then pick it from the dropdown when creating a new service-page idea.
            </p>
          </div>

          <div>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#FFFFFF",
                background: "#10B981",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              + New template
            </button>
          </div>
        </div>

        {/* 3. TEMPLATES TABLE */}
        <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", marginTop: "24px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "12px 20px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>NAME</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>SOURCE</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>SECTIONS</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>WORDS</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>USED BY</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>CREATED</th>
                <th style={{ padding: "12px 20px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 ? (
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "14px 20px", fontWeight: "700", color: "#0F172A", fontSize: "0.875rem" }}>
                    Service Page - Altitude
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <span style={{ fontSize: "0.6875rem", padding: "2px 8px", borderRadius: "4px", background: "#EDE9FE", color: "#6D28D9", fontWeight: "700" }}>
                      IMAGE
                    </span>
                  </td>
                  <td style={{ padding: "14px 14px", fontSize: "0.8125rem", color: "#475569" }}>10</td>
                  <td style={{ padding: "14px 14px", fontSize: "0.8125rem", color: "#475569" }}>1330</td>
                  <td style={{ padding: "14px 14px", fontSize: "0.8125rem", color: "#475569" }}>22 ideas</td>
                  <td style={{ padding: "14px 14px", fontSize: "0.8125rem", color: "#64748B" }}>2026-05-07</td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <button style={{ padding: "3px 8px", fontSize: "0.725rem", color: "#0284C7", background: "transparent", border: "none", cursor: "pointer", marginRight: "6px" }}>Edit</button>
                    <button style={{ padding: "3px 8px", fontSize: "0.725rem", color: "#DC2626", background: "transparent", border: "none", cursor: "pointer" }}>Delete</button>
                  </td>
                </tr>
              ) : (
                templates.map((tpl) => (
                  <tr key={tpl.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "14px 20px", fontWeight: "700", color: "#0F172A", fontSize: "0.875rem" }}>
                      {tpl.name}
                    </td>
                    <td style={{ padding: "14px 14px" }}>
                      <span style={{ fontSize: "0.6875rem", padding: "2px 8px", borderRadius: "4px", background: "#EDE9FE", color: "#6D28D9", fontWeight: "700" }}>
                        {tpl.source}
                      </span>
                    </td>
                    <td style={{ padding: "14px 14px", fontSize: "0.8125rem", color: "#475569" }}>{tpl.sectionsCount}</td>
                    <td style={{ padding: "14px 14px", fontSize: "0.8125rem", color: "#475569" }}>{tpl.wordCount}</td>
                    <td style={{ padding: "14px 14px", fontSize: "0.8125rem", color: "#475569" }}>{tpl.usedByCount} ideas</td>
                    <td style={{ padding: "14px 14px", fontSize: "0.8125rem", color: "#64748B" }}>{new Date(tpl.createdAt).toISOString().slice(0, 10)}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <button onClick={() => success("Edit template loaded")} style={{ padding: "3px 8px", fontSize: "0.725rem", color: "#0284C7", background: "transparent", border: "none", cursor: "pointer", marginRight: "6px" }}>Edit</button>
                      <button onClick={() => handleDelete(tpl.id)} style={{ padding: "3px 8px", fontSize: "0.725rem", color: "#DC2626", background: "transparent", border: "none", cursor: "pointer" }}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CREATE TEMPLATE MODAL */}
        {isModalOpen && (
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
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0F172A", margin: 0 }}>New Page Template</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Commercial Service Page"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                      Source
                    </label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                    >
                      <option value="IMAGE">IMAGE</option>
                      <option value="URL">URL</option>
                      <option value="MANUAL">MANUAL</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                      Sections Count
                    </label>
                    <input
                      type="number"
                      value={sectionsCount}
                      onChange={(e) => setSectionsCount(parseInt(e.target.value) || 10)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Target Word Count
                  </label>
                  <input
                    type="number"
                    value={wordCount}
                    onChange={(e) => setWordCount(parseInt(e.target.value) || 1300)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: "8px 14px", fontSize: "0.8125rem", color: "#475569", background: "#F1F5F9", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{ padding: "8px 18px", fontSize: "0.8125rem", fontWeight: "600", color: "#FFFFFF", background: "#10B981", border: "none", borderRadius: "6px", cursor: isSaving ? "not-allowed" : "pointer" }}
                  >
                    {isSaving ? "Creating..." : "Create Template"}
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
