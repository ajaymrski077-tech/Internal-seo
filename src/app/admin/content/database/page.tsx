"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, X, ChevronLeft, ChevronRight, Edit2, Trash2 } from "lucide-react";
import PageLoader from "@/components/PageLoader";
import { useToast } from "@/components/ToastContext";

interface ContentRecord {
  id: string;
  clientId: string;
  client: string;
  title: string;
  url: string;
  type: string;
  date: string;
  status?: string;
}

interface ClientOption {
  id: string;
  name: string;
  defaultPropertyId?: string;
}

interface TypeStat {
  type: string;
  count: number;
  color: string;
}

interface ClientStat {
  client: string;
  count: number;
  percentage: number;
  color: string;
}

export default function ContentDatabasePage() {
  const [records, setRecords] = useState<ContentRecord[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [typeStats, setTypeStats] = useState<TypeStat[]>([]);
  const [clientStats, setClientStats] = useState<ClientStat[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClientFilter, setSelectedClientFilter] = useState("All Clients");
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Add Content Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split("T")[0]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [contentType, setContentType] = useState("Blog Post");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/database?client=${encodeURIComponent(selectedClientFilter)}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setClients(data.clients || []);
        setTypeStats(data.typeStats || []);
        setClientStats(data.clientStats || []);
        if (data.clients && data.clients.length > 0 && !selectedClient) {
          setSelectedClient(data.clients[0].id);
        }
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClientFilter, selectedClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !title.trim()) {
      toastError("Please choose a client and provide a title.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/content/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient,
          title,
          url,
          type: contentType
        })
      });

      if (res.ok) {
        success("Content record added successfully!");
        setIsModalOpen(false);
        setTitle("");
        setUrl("");
        fetchData();
      } else {
        const err = await res.json();
        toastError(err.error || "Failed to add content record.");
      }
    } catch {
      toastError("Network error while adding content.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this content item?")) return;

    try {
      const res = await fetch(`/api/content/database?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        success("Record deleted successfully.");
        fetchData();
      } else {
        toastError("Failed to delete record.");
      }
    } catch {
      toastError("Network error while deleting.");
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(records.length / perPage) || 1;
  const paginatedRecords = records.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Calculate Donut Angles
  const totalTypeCount = typeStats.reduce((sum, t) => sum + t.count, 0);

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "28px 0 80px 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TOP STATS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "20px", marginBottom: "28px" }}>
          
          {/* Content by Type Card */}
          <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: "600" }}>Content by Type</span>
              <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Live Sync</span>
            </div>

            {typeStats.length === 0 ? (
              <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "0.8125rem" }}>
                No content items published yet
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: "160px" }}>
                <div style={{ position: "relative", width: "120px", height: "120px" }}>
                  <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                    {typeStats.map((stat, idx) => {
                      const strokeDash = (stat.count / totalTypeCount) * 100;
                      const prevCount = typeStats.slice(0, idx).reduce((s, x) => s + x.count, 0);
                      const strokeOffset = 100 - (prevCount / totalTypeCount) * 100;
                      return (
                        <circle
                          key={stat.type}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke={stat.color}
                          strokeWidth="4"
                          strokeDasharray={`${strokeDash} ${100 - strokeDash}`}
                          strokeDashoffset={strokeOffset}
                        />
                      );
                    })}
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0F172A" }}>{totalTypeCount}</span>
                    <span style={{ fontSize: "0.625rem", color: "#64748B", textTransform: "uppercase" }}>Total</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {typeStats.map((stat) => (
                    <div key={stat.type} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: stat.color }}></span>
                      <span style={{ color: "#475569", fontWeight: "500" }}>{stat.type}</span>
                      <span style={{ color: "#0F172A", fontWeight: "700", marginLeft: "auto" }}>{stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content by Client Card */}
          <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: "600" }}>Content by Client</span>
              <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Database Records</span>
            </div>

            {clientStats.length === 0 ? (
              <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "0.8125rem" }}>
                No client content records found
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "160px", overflowY: "auto" }}>
                {clientStats.map((cs) => (
                  <div key={cs.client} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.75rem" }}>
                    <span style={{ width: "120px", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cs.client}
                    </span>
                    <div style={{ flex: 1, background: "#F1F5F9", height: "12px", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${cs.percentage}%`, height: "100%", background: cs.color, borderRadius: "4px" }}></div>
                    </div>
                    <span style={{ width: "24px", textAlign: "right", color: "#0F172A", fontWeight: "700" }}>
                      {cs.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. CONTROLS BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              style={{
                padding: "6px 12px",
                fontSize: "0.8125rem",
                borderRadius: "6px",
                border: "1px solid #CBD5E1",
                background: "#FFFFFF",
                color: "#0F172A",
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="All Clients">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#64748B", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              Show archived
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "0.8125rem", color: "#64748B" }}>
              {records.length} pieces
            </span>

            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#0F172A",
                color: "#FFFFFF",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                border: "none",
                cursor: "pointer"
              }}
            >
              <Plus size={14} /> Add Content
            </button>
          </div>
        </div>

        {/* 3. TABLE OF RECORDS */}
        <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          {loading ? (
            <PageLoader message="Loading Content Library" subtitle="Syncing live database records" showSkeleton />
          ) : records.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748B" }}>
              <p style={{ margin: "0 0 12px 0", fontSize: "0.9375rem", fontWeight: "600", color: "#0F172A" }}>No Content Pieces Found</p>
              <p style={{ margin: "0 0 16px 0", fontSize: "0.8125rem", color: "#64748B" }}>
                Add your first live content item or generate ideas and drafts through client workspaces.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  background: "#0F172A",
                  color: "#FFFFFF",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "0.8125rem",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                + Add Content Piece
              </button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: "700", textTransform: "uppercase", fontSize: "0.6875rem" }}>
                  <th style={{ padding: "12px 20px" }}>Client</th>
                  <th style={{ padding: "12px 20px" }}>Title</th>
                  <th style={{ padding: "12px 20px" }}>URL</th>
                  <th style={{ padding: "12px 20px" }}>Type</th>
                  <th style={{ padding: "12px 20px" }}>Date</th>
                  <th style={{ padding: "12px 20px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s" }}>
                    <td style={{ padding: "14px 20px", fontWeight: "600", color: "#0F172A" }}>
                      {item.client}
                    </td>
                    <td style={{ padding: "14px 20px", color: "#1E293B", fontWeight: "600", maxWidth: "340px" }}>
                      {item.title}
                    </td>
                    <td style={{ padding: "14px 20px", color: "#3B82F6", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", textDecoration: "none" }}>
                        {item.url}
                      </a>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.6875rem",
                        fontWeight: "700",
                        background: item.type === "Blog Post" ? "#EDE9FE" : "#FEF3C7",
                        color: item.type === "Blog Post" ? "#6D28D9" : "#92400E"
                      }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", color: "#64748B", whiteSpace: "nowrap" }}>
                      {item.date}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{ background: "none", border: "none", color: "#EF4444", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 4. PAGINATION FOOTER */}
          {records.length > perPage && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "#64748B" }}>
                <span>Items per page:</span>
                <select
                  value={perPage}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #CBD5E1", background: "#FFFFFF", fontSize: "0.75rem" }}
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                  Page {currentPage} of {totalPages}
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #CBD5E1", background: "#FFFFFF", cursor: currentPage <= 1 ? "not-allowed" : "pointer" }}
                  >
                    <ChevronLeft size={14} color={currentPage <= 1 ? "#94A3B8" : "#0F172A"} />
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #CBD5E1", background: "#FFFFFF", cursor: currentPage >= totalPages ? "not-allowed" : "pointer" }}
                  >
                    <ChevronRight size={14} color={currentPage >= totalPages ? "#94A3B8" : "#0F172A"} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. ADD CONTENT MODAL */}
        {isModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "540px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0F172A" }}>Add Content Item</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Client</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                  >
                    <option value="">Select a client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Content Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Complete Guide to Residential Roofing"
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Content Type</label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                    >
                      <option value="Blog Post">Blog Post</option>
                      <option value="Page Update">Page Update</option>
                      <option value="Landing Page">Landing Page</option>
                      <option value="Case Study">Case Study</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Date</label>
                    <input
                      type="date"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#FFFFFF", fontSize: "0.8125rem", color: "#475569", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ padding: "8px 18px", borderRadius: "6px", border: "none", background: "#0F172A", color: "#FFFFFF", fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer" }}
                  >
                    {isSubmitting ? "Saving..." : "Save Item"}
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
