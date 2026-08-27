"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import PageLoader from "@/components/PageLoader";
import { useToast } from "@/components/ToastContext";

interface GapProject {
  id: string;
  name: string;
  client: string;
  mode: string;
  analysesCount: number;
  lastGaps: number;
  lastRun: string;
}

export default function ContentGapAnalysisPage() {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [projectName, setProjectName] = useState("");
  const [mode, setMode] = useState("1 competitor (1:1)");
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [projects, setProjects] = useState<GapProject[]>([]);
  const [loading, setLoading] = useState(true);

  const { success, error: toastError } = useToast();

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
        }
      } catch (err) {
        console.error("Failed to load clients:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !projectName) return;
    setIsCreating(true);
    setTimeout(() => {
      const newProj: GapProject = {
        id: projectName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name: projectName,
        client: selectedClient,
        mode,
        analysesCount: 0,
        lastGaps: 0,
        lastRun: "Never",
      };
      setProjects([newProj, ...projects]);
      success("New content-gap project created!");
      setIsNewProjectOpen(false);
      setIsCreating(false);
      setProjectName("");
      setSitemapUrl("");
    }, 400);
  };

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "28px 0 80px 0" }}>
      <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
              Content Gap Analysis
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
              Audit content gaps between client domains and competing publishers.
            </p>
          </div>
          <button
            onClick={() => setIsNewProjectOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              fontSize: "0.8125rem",
              fontWeight: "600",
              color: "#FFFFFF",
              background: "#10B981",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            + New project
          </button>
        </div>

        {/* 2. PROJECTS TABLE */}
        <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          {loading ? (
            <PageLoader message="Loading Gap Projects" subtitle="Scanning content gap database" />
          ) : projects.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748B" }}>
              <p style={{ margin: "0 0 10px 0", fontSize: "0.9375rem", fontWeight: "700", color: "#0F172A" }}>No Gap Projects Created Yet</p>
              <p style={{ margin: "0 0 16px 0", fontSize: "0.8125rem", color: "#64748B" }}>
                Click &quot;+ New project&quot; to set up a 1:1 or 1:many competitor gap crawl for any client.
              </p>
              <button
                onClick={() => setIsNewProjectOpen(true)}
                style={{
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
                + Create Gap Project
              </button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "12px 20px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>PROJECT</th>
                  <th style={{ padding: "12px 16px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>CLIENT</th>
                  <th style={{ padding: "12px 16px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>MODE</th>
                  <th style={{ padding: "12px 16px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>ANALYSES</th>
                  <th style={{ padding: "12px 16px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>LAST GAPS</th>
                  <th style={{ padding: "12px 16px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>LAST RUN</th>
                  <th style={{ padding: "12px 20px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => (
                  <tr
                    key={proj.id}
                    style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <Link
                        href={`/admin/content/gap-analysis/${proj.id}`}
                        style={{ fontSize: "0.875rem", fontWeight: "700", color: "#10B981", textDecoration: "none" }}
                      >
                        {proj.name}
                      </Link>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "0.8125rem", color: "#334155" }}>{proj.client}</td>
                    <td style={{ padding: "14px 16px", fontSize: "0.8125rem", color: "#64748B" }}>{proj.mode}</td>
                    <td style={{ padding: "14px 16px", fontSize: "0.8125rem", color: "#64748B" }}>{proj.analysesCount}</td>
                    <td style={{ padding: "14px 16px", fontSize: "0.8125rem", color: "#64748B" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", background: "#FEF3C7", color: "#B45309", fontSize: "0.75rem", fontWeight: "600" }}>
                        {proj.lastGaps} gaps
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "0.8125rem", color: "#64748B" }}>{proj.lastRun}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <Link
                        href={`/admin/content/gap-analysis/${proj.id}`}
                        style={{
                          padding: "4px 14px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          color: "#FFFFFF",
                          background: "#6366F1",
                          borderRadius: "4px",
                          textDecoration: "none",
                          display: "inline-block"
                        }}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 3. NEW PROJECT MODAL */}
        {isNewProjectOpen && (
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
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0F172A", margin: 0 }}>New content-gap project</h3>
                <button onClick={() => setIsNewProjectOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Client
                  </label>
                  <select
                    required
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", color: "#334155" }}
                  >
                    <option value="">— Select a client —</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Core Services Gap Analysis"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Competitor Sitemap or URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://competitor.com/sitemap.xml"
                    value={sitemapUrl}
                    onChange={(e) => setSitemapUrl(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setIsNewProjectOpen(false)}
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#FFFFFF", fontSize: "0.8125rem", color: "#64748B", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    style={{ padding: "8px 18px", borderRadius: "6px", border: "none", background: "#10B981", color: "#FFFFFF", fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer" }}
                  >
                    {isCreating ? "Creating..." : "Create Project"}
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
