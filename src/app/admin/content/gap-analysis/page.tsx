"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
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
  const [selectedClient, setSelectedClient] = useState("");
  const [projectName, setProjectName] = useState("");
  const [mode, setMode] = useState("1 competitor (1:1)");
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { toast, success, error: toastError } = useToast();

  const [projects, setProjects] = useState<GapProject[]>([
    {
      id: "mortgaged-supporting",
      name: "Mortgaged - Supporting",
      client: "Mortgaged",
      mode: "1 competitor (1:1)",
      analysesCount: 1,
      lastGaps: 47,
      lastRun: "7/20/2026",
    },
    {
      id: "jofson-general",
      name: "Jofson - General",
      client: "Jofson",
      mode: "1 competitor (1:1)",
      analysesCount: 1,
      lastGaps: 4,
      lastRun: "7/10/2026",
    },
    {
      id: "datum-general",
      name: "Datum - General",
      client: "Datum",
      mode: "1 competitor (1:1)",
      analysesCount: 1,
      lastGaps: 24,
      lastRun: "4/28/2026",
    },
    {
      id: "evolution-general",
      name: "Evolution - General",
      client: "Evolution Plumbing",
      mode: "1 competitor (1:1)",
      analysesCount: 1,
      lastGaps: 51,
      lastRun: "4/23/2026",
    },
    {
      id: "reed-bristol-accountants",
      name: "Reed - Bristol Accountants",
      client: "Reed Accountants",
      mode: "1 competitor (1:1)",
      analysesCount: 1,
      lastGaps: 6,
      lastRun: "4/20/2026",
    },
    {
      id: "botonics-roaccutane",
      name: "Botonics - Roaccutane",
      client: "Botonics",
      mode: "1 competitor (1:1)",
      analysesCount: 1,
      lastGaps: 13,
      lastRun: "4/20/2026",
    },
    {
      id: "sd-test",
      name: "SD - Test",
      client: "SD Plumbing & Heating",
      mode: "1 competitor (1:1)",
      analysesCount: 1,
      lastGaps: 1,
      lastRun: "4/20/2026",
    },
  ]);

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
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
            Content Gap Analysis
          </h1>
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
                    <option value="Mortgaged">Mortgaged</option>
                    <option value="Jofson">Jofson</option>
                    <option value="Datum">Datum</option>
                    <option value="Evolution Plumbing">Evolution Plumbing</option>
                    <option value="Reed Accountants">Reed Accountants</option>
                    <option value="Botonics">Botonics</option>
                    <option value="SD Plumbing & Heating">SD Plumbing & Heating</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Project name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q2 plumbing competitor analysis"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", color: "#334155" }}
                  >
                    <option value="1 competitor (1:1)">1 competitor (1:1)</option>
                    <option value="Multi-competitor (1:Many)">Multi-competitor (1:Many)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Our sitemap URL (optional, can set per analysis)
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/sitemap.xml"
                    value={sitemapUrl}
                    onChange={(e) => setSitemapUrl(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setIsNewProjectOpen(false)}
                    style={{ padding: "8px 14px", fontSize: "0.8125rem", color: "#475569", background: "#F1F5F9", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    style={{ padding: "8px 18px", fontSize: "0.8125rem", fontWeight: "600", color: "#FFFFFF", background: "#10B981", border: "none", borderRadius: "6px", cursor: isCreating ? "not-allowed" : "pointer" }}
                  >
                    {isCreating ? "Creating..." : "Create project"}
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
