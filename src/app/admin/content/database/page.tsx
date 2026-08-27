"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X, ChevronLeft, ChevronRight, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ToastContext";

interface ContentRecord {
  id: string;
  client: string;
  title: string;
  url: string;
  type: string;
  date: string;
}

export default function ContentDatabasePage() {
  const [selectedClientFilter, setSelectedClientFilter] = useState("All Clients");
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Add Content Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [client, setClient] = useState("");
  const [publishDate, setPublishDate] = useState("2026-08-27");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [contentType, setContentType] = useState("Blog Post");
  const [internalNotes, setInternalNotes] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast, success, error: toastError } = useToast();

  const mockRecords: ContentRecord[] = [
    {
      id: "1",
      client: "Datum",
      title: "What is a Meet Me Room? | Datum Datacentres",
      url: "https://www.datum.co.uk/insights/blog/what-is-a-meet-me-room/",
      type: "Blog Post",
      date: "2026-08-26",
    },
    {
      id: "2",
      client: "Botonics",
      title: "Draft #200",
      url: "https://www.botonics.co.uk/blog/cosmetic-dermatology/what-is-tear-trough-filler/",
      type: "Page Update",
      date: "2026-08-25",
    },
    {
      id: "3",
      client: "Botonics",
      title: "What is Tear Trough Filler? - Uses, Benefits, and Treatment Guide",
      url: "https://www.botonics.co.uk/blog/cosmetic-dermatology/what-is-tear-trough-filler/",
      type: "Page Update",
      date: "2026-08-25",
    },
    {
      id: "4",
      client: "Botonics",
      title: "Draft #209",
      url: "https://www.botonics.co.uk/blog/acne-treatments/how-long-does-roaccutane-take-to-work/",
      type: "Page Update",
      date: "2026-08-25",
    },
    {
      id: "5",
      client: "Employment Lawyer London",
      title: "Bonus, Shares & LTIPs in a Settlement Agreement | Employment Lawyer London",
      url: "https://employmentlawyer.london/employees/bonus-shares-ltips-senior-executive-settlement-agreement/",
      type: "Blog Post",
      date: "2026-08-21",
    },
    {
      id: "6",
      client: "Botonics",
      title: "Draft #192",
      url: "https://www.botonics.co.uk/blog/acne-treatments/how-does-roaccutane-work/",
      type: "Page Update",
      date: "2026-08-19",
    },
    {
      id: "7",
      client: "Botonics",
      title: "Draft #191",
      url: "https://www.botonics.co.uk/blog/acne-treatments/what-is-roaccutane/",
      type: "Page Update",
      date: "2026-08-19",
    },
    {
      id: "8",
      client: "Altitude Roofing",
      title: "How Long Does a Roof Replacement Take? - Altitude Roofing",
      url: "https://altitudeedinburghroofing.com/blog/how-long-does-roof-replacement-take/",
      type: "Blog Post",
      date: "2026-08-19",
    },
    {
      id: "9",
      client: "Altitude Roofing",
      title: "Slate vs Tile Roof: Which is Right for Your Home? - Altitude Roofing",
      url: "https://altitudeedinburghroofing.com/blog/slate-vs-tile-roof/",
      type: "Blog Post",
      date: "2026-08-19",
    },
    {
      id: "10",
      client: "Botonics",
      title: "Blog posts redesign",
      url: "https://www.botonics.co.uk/blog/",
      type: "Page Update",
      date: "2026-08-18",
    },
    {
      id: "11",
      client: "Datum",
      title: "Colocation for Scale-Ups",
      url: "https://www.datum.co.uk/insights/blog/colocation-scale-ups/",
      type: "Blog Post",
      date: "2026-08-18",
    },
    {
      id: "12",
      client: "Datum",
      title: "Data Centre Glossary",
      url: "https://www.datum.co.uk/insights/data-centre-glossary/",
      type: "Blog Post",
      date: "2026-08-18",
    },
    {
      id: "13",
      client: "Datum",
      title: "Remote Hands in Colocation",
      url: "https://www.datum.co.uk/insights/remote-hands-colocation/",
      type: "Blog Post",
      date: "2026-08-18",
    },
    {
      id: "14",
      client: "Datum",
      title: "Colocation Compliance Checklist",
      url: "https://www.datum.co.uk/insights/colocation-compliance-checklist/",
      type: "Blog Post",
      date: "2026-08-18",
    },
    {
      id: "15",
      client: "Botonics",
      title: "Back Acne: Why It Happens and What Clears It",
      url: "https://www.botonics.co.uk/blog/acne-treatments/back-acne-causes-and-treatments/",
      type: "Blog Post",
      date: "2026-08-18",
    },
    {
      id: "16",
      client: "Botonics",
      title: "How long does a Roaccutane purge last?",
      url: "https://www.botonics.co.uk/blog/acne-treatments/how-long-does-roaccutane-purge-last/",
      type: "Blog Post",
      date: "2026-08-18",
    },
    {
      id: "17",
      client: "Datum",
      title: "Remote hands services in colocation: what they are and when you need them",
      url: "https://www.datum.co.uk/insights/remote-hands-colocation/",
      type: "Blog Post",
      date: "2026-08-18",
    },
    {
      id: "18",
      client: "Datum",
      title: "Colocation compliance checklist: what to ask your provider before you sign",
      url: "https://www.datum.co.uk/insights/colocation-compliance-checklist/",
      type: "Blog Post",
      date: "2026-08-18",
    },
    {
      id: "19",
      client: "EIN Search",
      title: "Full Site Launched",
      url: "https://einsearch.com/",
      type: "Page Update",
      date: "2026-08-17",
    },
    {
      id: "20",
      client: "Datum",
      title: "Data centre glossary: terms and definitions explained",
      url: "https://www.datum.co.uk/insights/data-centre-glossary/",
      type: "Blog Post",
      date: "2026-08-17",
    },
  ];

  const handleAddContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !title) return;
    setIsSubmitting(true);
    setTimeout(() => {
      success("Content piece recorded in database!");
      setIsModalOpen(false);
      setIsSubmitting(false);
      setTitle("");
      setUrl("");
      setInternalNotes("");
      setClientNotes("");
    }, 400);
  };

  const clientsList = [
    { name: "Evolution Plumbing", posts: 10, updates: 4 },
    { name: "Botonics", posts: 4, updates: 6 },
    { name: "Datum", posts: 9, updates: 0 },
    { name: "Altitude Roofing", posts: 2, updates: 0 },
    { name: "Mortgaged", posts: 2, updates: 0 },
    { name: "Reed Accountants", posts: 2, updates: 0 },
    { name: "Compass Rentals", posts: 0, updates: 1 },
    { name: "EIN Search", posts: 0, updates: 1 },
    { name: "Employment Lawyer London", posts: 1, updates: 0 },
    { name: "Brick Anew", posts: 0, updates: 0 },
    { name: "Brockwood", posts: 0, updates: 0 },
    { name: "Jofson", posts: 0, updates: 0 },
    { name: "Novus BC", posts: 0, updates: 0 },
    { name: "Pehrsson Scott", posts: 0, updates: 0 },
    { name: "SD Plumbing & Heating", posts: 0, updates: 0 },
    { name: "TurnerBerry", posts: 0, updates: 0 },
    { name: "Veeve", posts: 0, updates: 0 },
    { name: "Vertex", posts: 0, updates: 0 },
  ];

  const months = [
    { label: "Sept 25", val1: 4, val2: 0, val3: 0, val4: 0 },
    { label: "Oct 25", val1: 8, val2: 0, val3: 0, val4: 0 },
    { label: "Nov 25", val1: 7, val2: 0, val3: 0, val4: 0 },
    { label: "Dec 25", val1: 15, val2: 0, val3: 0, val4: 0 },
    { label: "Jan 26", val1: 15, val2: 0, val3: 0, val4: 0 },
    { label: "Feb 26", val1: 6, val2: 0, val3: 0, val4: 0 },
    { label: "Mar 26", val1: 6, val2: 0, val3: 0, val4: 0 },
    { label: "Apr 26", val1: 14, val2: 0, val3: 0, val4: 0 },
    { label: "May 26", val1: 12, val2: 18, val3: 0, val4: 0 },
    { label: "Jun 26", val1: 5, val2: 0, val3: 0, val4: 0 },
    { label: "Jul 26", val1: 10, val2: 0, val3: 16, val4: 0 },
    { label: "Aug 26", val1: 18, val2: 0, val3: 8, val4: 0 },
  ];

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "28px 0 80px 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TOP TITLE & ACTION */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
            Content Database
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: "8px 18px",
              fontSize: "0.8125rem",
              fontWeight: "600",
              color: "#FFFFFF",
              background: "#0F4C5C",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            + Add Content
          </button>
        </div>

        {/* 2. 12 MONTH OVERVIEW BAR CHART */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: "700", color: "#334155" }}>12 Month Overview</span>
            
            {/* Legend */}
            <div style={{ display: "flex", gap: "12px", fontSize: "0.6875rem", color: "#64748B", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "#8B5CF6", borderRadius: "2px" }} /> Blog Post</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "#14B8A6", borderRadius: "2px" }} /> Service Page</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "#06B6D4", borderRadius: "2px" }} /> Landing Page</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "#F59E0B", borderRadius: "2px" }} /> Page Update</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "#EAB308", borderRadius: "2px" }} /> Case Study</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "#10B981", borderRadius: "2px" }} /> Linkable Asset</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "#94A3B8", borderRadius: "2px" }} /> Other</span>
            </div>
          </div>

          {/* Bar chart matrix */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "8px", height: "120px", alignItems: "end", borderBottom: "1px solid #E2E8F0", paddingBottom: "8px" }}>
            {months.map((m, idx) => {
              const totalHeight = Math.min(100, (m.val1 + m.val2 + m.val3) * 2.5);
              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ width: "32px", height: `${totalHeight}%`, display: "flex", flexDirection: "column-reverse", borderRadius: "3px 3px 0 0", overflow: "hidden" }}>
                    {m.val1 > 0 && <div style={{ height: `${(m.val1 / (m.val1 + m.val2 + m.val3)) * 100}%`, background: "#8B5CF6" }} />}
                    {m.val2 > 0 && <div style={{ height: `${(m.val2 / (m.val1 + m.val2 + m.val3)) * 100}%`, background: "#14B8A6" }} />}
                    {m.val3 > 0 && <div style={{ height: `${(m.val3 / (m.val1 + m.val2 + m.val3)) * 100}%`, background: "#F59E0B" }} />}
                  </div>
                  <span style={{ fontSize: "0.625rem", color: "#64748B", marginTop: "6px" }}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. TWO SUB-CHARTS (Content by Type & Content by Client) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "20px", marginBottom: "24px" }}>
          
          {/* Left: Content by Type Donut */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: "700", color: "#334155" }}>Content by Type</span>
              <select style={{ padding: "3px 8px", fontSize: "0.725rem", borderRadius: "4px", border: "1px solid #CBD5E1" }}>
                <option>Aug 2026</option>
                <option>Jul 2026</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "32px", padding: "20px 0" }}>
              {/* Donut graphic */}
              <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: "conic-gradient(#8B5CF6 0% 65%, #F59E0B 65% 100%)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#FFFFFF" }} />
              </div>

              {/* Donut Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", background: "#8B5CF6", borderRadius: "2px" }} />
                  <span style={{ color: "#334155" }}>Blog Post</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", background: "#F59E0B", borderRadius: "2px" }} />
                  <span style={{ color: "#334155" }}>Page Update</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Content by Client Bar Chart */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: "700", color: "#334155" }}>Content by Client</span>
              <span style={{ fontSize: "0.6875rem", color: "#94A3B8" }}>Filtered</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "240px", overflowY: "auto" }}>
              {clientsList.map((c, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "150px 1fr", alignItems: "center", gap: "10px", fontSize: "0.7rem" }}>
                  <span style={{ color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                  <div style={{ display: "flex", height: "10px", borderRadius: "2px", overflow: "hidden", background: "#F1F5F9", width: "100%" }}>
                    {c.posts > 0 && <div style={{ width: `${(c.posts / 14) * 100}%`, background: "#8B5CF6" }} />}
                    {c.updates > 0 && <div style={{ width: `${(c.updates / 14) * 100}%`, background: "#F59E0B" }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 4. CONTENT PIECES TABLE */}
        <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          {/* Table filter bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <select
                value={selectedClientFilter}
                onChange={(e) => setSelectedClientFilter(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", color: "#334155" }}
              >
                <option>All Clients</option>
                <option>Evolution Plumbing</option>
                <option>Botonics</option>
                <option>Datum</option>
                <option>Altitude Roofing</option>
                <option>Employment Lawyer London</option>
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.775rem", color: "#64748B", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                Show archived
              </label>
            </div>
            <span style={{ fontSize: "0.775rem", color: "#64748B" }}>20 pieces</span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "10px 18px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>CLIENT</th>
                <th style={{ padding: "10px 18px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>TITLE</th>
                <th style={{ padding: "10px 18px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>URL</th>
                <th style={{ padding: "10px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>TYPE</th>
                <th style={{ padding: "10px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>DATE</th>
                <th style={{ padding: "10px 18px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {mockRecords.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 18px", fontSize: "0.8125rem", color: "#334155", fontWeight: "600" }}>{item.client}</td>
                  <td style={{ padding: "12px 18px", fontSize: "0.8125rem", color: "#0F172A", fontWeight: "700" }}>{item.title}</td>
                  <td style={{ padding: "12px 18px", fontSize: "0.75rem", color: "#0284C7", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <a href={item.url} target="_blank" rel="noreferrer" style={{ color: "#0284C7", textDecoration: "none" }}>{item.url}</a>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: item.type === "Blog Post" ? "#EDE9FE" : "#FEF3C7",
                        color: item.type === "Blog Post" ? "#6D28D9" : "#B45309",
                        fontWeight: "700"
                      }}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: "0.775rem", color: "#64748B" }}>{item.date}</td>
                  <td style={{ padding: "12px 18px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
                      <button onClick={() => success("Editing content piece")} style={{ fontSize: "0.6875rem", color: "#0F4C5C", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}>Edit</button>
                      <button onClick={() => success("Content piece archived")} style={{ fontSize: "0.6875rem", color: "#DC2626", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table Pagination */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid #E2E8F0", fontSize: "0.75rem", color: "#64748B" }}>
            <span>Showing 1 - 20 of 395 content items</span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span>Per page: <strong>20</strong> ▾</span>
              <span>Page 1 of 20</span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button style={{ padding: "3px 6px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "3px", cursor: "pointer" }}><ChevronLeft size={12} /></button>
                <button style={{ padding: "3px 6px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "3px", cursor: "pointer" }}><ChevronRight size={12} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. ADD CONTENT MODAL */}
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
            <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "560px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0F172A", margin: 0 }}>Add Content</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddContent} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "4px" }}>
                      CLIENT *
                    </label>
                    <select
                      required
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", color: "#334155" }}
                    >
                      <option value="">Select client...</option>
                      <option value="Datum">Datum</option>
                      <option value="Botonics">Botonics</option>
                      <option value="Evolution Plumbing">Evolution Plumbing</option>
                      <option value="Altitude Roofing">Altitude Roofing</option>
                      <option value="Employment Lawyer London">Employment Lawyer London</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "4px" }}>
                      PUBLISH DATE *
                    </label>
                    <input
                      type="date"
                      required
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "4px" }}>
                    TITLE *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Content title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "4px" }}>
                    URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://client.com/blog/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "4px" }}>
                    CONTENT TYPE
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", color: "#334155" }}
                  >
                    <option>Blog Post</option>
                    <option>Service Page</option>
                    <option>Landing Page</option>
                    <option>Page Update</option>
                    <option>Case Study</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "4px" }}>
                    INTERNAL NOTES
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Notes for the team — never shown to the client."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.775rem", resize: "vertical" }}
                  />
                  <div style={{ fontSize: "0.6875rem", color: "#94A3B8", marginTop: "2px" }}>Visible only inside the dashboard.</div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "4px" }}>
                    CLIENT NOTES
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short note that appears on the client's traffic graph and content list."
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.775rem", resize: "vertical" }}
                  />
                  <div style={{ fontSize: "0.6875rem", color: "#94A3B8", marginTop: "2px" }}>Shown on the client report — keep it brief.</div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: "8px 14px", fontSize: "0.8125rem", color: "#475569", background: "#F1F5F9", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ padding: "8px 18px", fontSize: "0.8125rem", fontWeight: "600", color: "#FFFFFF", background: "#0F4C5C", border: "none", borderRadius: "6px", cursor: isSubmitting ? "not-allowed" : "pointer" }}
                  >
                    {isSubmitting ? "Adding..." : "Add Content"}
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
