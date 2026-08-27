"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageLoader from "@/components/PageLoader";

interface Vertical {
  id: string;
  name: string;
  slug: string;
  covers: string;
  usedBy: string;
}

export default function VerticalTaxonomyPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState(500);
  const [covers, setCovers] = useState("");

  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVerticals();
  }, []);

  const fetchVerticals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pr/verticals");
      if (res.ok) {
        const data = await res.json();
        setVerticals(data);
      }
    } catch (err) {
      console.error("Failed to fetch verticals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVertical = async () => {
    if (!name) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/pr/verticals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, sortOrder, covers })
      });
      if (res.ok) {
        setName("");
        setSlug("");
        setSortOrder(500);
        setCovers("");
        fetchVerticals();
      }
    } catch (err) {
      console.error("Failed to create vertical", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
            <Link href="/admin/pr" style={{ color: "#64748B", textDecoration: "none" }}>PR</Link> / VERTICALS
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Vertical Taxonomy
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0, lineHeight: "1.5" }}>
            The sector tags the whole PR module runs on. A vertical does two jobs: it decides which national dates seed a client&apos;s angle brainstorm, and it is what reactive matching will key off. Add a sector here and it appears as a tick box on every client immediately. No deploy needed.
          </p>
        </div>

        {/* Add a vertical Form */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px 24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
            Add a vertical
          </h3>
          <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 16px 0" }}>
            The slug is what gets stored on clients and dates, so it never changes after you create it. Leave it blank to derive it from the name.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Name</label>
              <input type="text" placeholder="e.g. Data centres" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Slug (optional)</label>
              <input type="text" placeholder="data_centres" value={slug} onChange={(e) => setSlug(e.target.value)} style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Sort order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }} />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>What it covers (optional)</label>
            <input type="text" placeholder="One line: the kind of story this sector pitches. Shows as a tooltip on the client form." value={covers} onChange={(e) => setCovers(e.target.value)} style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }} />
          </div>

          <button
            type="button"
            onClick={handleAddVertical}
            disabled={submitting}
            style={{
              background: "#0F4C5C",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "7px 16px",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting ? "Adding..." : "Add vertical"}
          </button>
        </div>

        {/* Current List Table */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 2px 0" }}>Current list</h3>
            <p style={{ fontSize: "11.5px", color: "#94A3B8", margin: 0 }}>
              Hidden verticals stay attached to any client already tagged with them; they just drop out of the picker. A vertical nothing uses can be deleted outright.
            </p>
          </div>

          {loading ? (
            <PageLoader message="Loading Verticals" subtitle="Fetching taxonomy data" showSkeleton />
          ) : verticals.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
              No verticals created yet. Add one above.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>VERTICAL</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>SLUG</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>COVERS</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>USED BY</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}></th>
                </tr>
              </thead>
              <tbody>
                {verticals.map((v) => (
                  <tr key={v.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0F172A" }}>
                      &bull; {v.name}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748B", fontFamily: "monospace" }}>
                      {v.slug}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>
                      {v.covers}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748B" }}>
                      {v.usedBy}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button style={{ background: "white", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "3px 8px", fontSize: "11px", cursor: "pointer" }}>
                        Hide
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
