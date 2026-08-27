"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import styles from "@/styles/Reports.module.css";

interface PieceReview {
  id: string;
  title: string;
  words: number;
  approvedDate: string;
  isLive: boolean;
}

export default function CustomerContentPreviewPage() {
  const router = useRouter();
  const rawParams = useParams();
  const clientId = (rawParams?.clientId as string) || "";

  const [clientName, setClientName] = useState("Altitude Roofing");
  const [loading, setLoading] = useState(false);

  const approvedPieces: PieceReview[] = [
    {
      id: "1",
      title: "How Long Does a Roof Replacement Take? - Altitude Roofing",
      words: 1923,
      approvedDate: "2026-08-19",
      isLive: true,
    },
    {
      id: "2",
      title: "Slate vs Tile Roof: Which is Right for Your Home? - Altitude Roofing",
      words: 1676,
      approvedDate: "2026-08-19",
      isLive: true,
    },
    {
      id: "3",
      title: "Moss on Roof Tiles: Removal & Prevention - Altitude Roofing",
      words: 1274,
      approvedDate: "2026-07-15",
      isLive: true,
    },
    {
      id: "4",
      title: "Roof Leaks in Heavy Rain: Causes & Fixes - Altitude Roofing",
      words: 1106,
      approvedDate: "2026-07-15",
      isLive: true,
    },
  ];

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh" }}>
      {/* 1. TOP DARK TEAL BANNER */}
      <div style={{ background: "#0F4C5C", color: "#FFFFFF", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8125rem" }}>
        <div>
          <strong>Customer view</strong> — This is what {clientName} sees at /hub when they sign in. Read-only preview — nothing here is logged as a client visit.
        </div>
        <Link
          href={`/admin/content/${clientId}`}
          style={{ color: "#FFFFFF", textDecoration: "underline", fontWeight: "600", fontSize: "0.8125rem" }}
        >
          ← Back to pipeline
        </Link>
      </div>

      {/* 2. CLIENT SUBHEADER */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
          <div style={{ width: "24px", height: "24px", background: "#0F172A", borderRadius: "4px" }}></div>
          <span style={{ fontWeight: "800", fontSize: "1.1rem", color: "#0F172A" }}>Arken</span>
          <span style={{ fontSize: "0.75rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: "700", marginLeft: "6px" }}>YOUR CONTENT</span>
        </div>

        {/* 3. PAGE TITLE */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0" }}>
              Your content
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#64748B", margin: 0 }}>
              Everything we&apos;ve sent {clientName} for review. Open any piece to read it, comment on it, or approve it.
            </p>
          </div>

          <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
            Can sign in:<br />
            <strong style={{ color: "#475569" }}>info@heightspecialist.co.uk</strong>
          </div>
        </div>

        {/* 4. 3-COLUMN KANBAN (To review | Changes underway | Approved) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", alignItems: "start" }}>
          
          {/* Column 1: To review */}
          <div style={{ background: "#F1F5F9", borderRadius: "10px", padding: "16px", minHeight: "360px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0F172A" }}>To review</span>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748B", background: "#E2E8F0", padding: "2px 7px", borderRadius: "9999px" }}>0</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "16px" }}>
              Sent to you and waiting on your read.
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#94A3B8", textAlign: "center", marginTop: "40px" }}>
              Nothing in this column.
            </div>
          </div>

          {/* Column 2: Changes underway */}
          <div style={{ background: "#F1F5F9", borderRadius: "10px", padding: "16px", minHeight: "360px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0F172A" }}>Changes underway</span>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748B", background: "#E2E8F0", padding: "2px 7px", borderRadius: "9999px" }}>0</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "16px" }}>
              You asked for edits. It&apos;s back with us.
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#94A3B8", textAlign: "center", marginTop: "40px" }}>
              Nothing in this column.
            </div>
          </div>

          {/* Column 3: Approved */}
          <div style={{ background: "#F1F5F9", borderRadius: "10px", padding: "16px", minHeight: "360px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0F172A" }}>Approved</span>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#15803D", background: "#DCFCE7", padding: "2px 7px", borderRadius: "9999px" }}>{approvedPieces.length}</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "16px" }}>
              Signed off by you.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {approvedPieces.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "14px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <strong style={{ fontSize: "0.875rem", color: "#0F172A", lineHeight: "1.3" }}>
                    {p.title}
                  </strong>
                  <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                    {p.words.toLocaleString()} words · Approved {p.approvedDate}
                  </div>
                  <div>
                    <span style={{ fontSize: "0.6875rem", fontWeight: "700", background: "#DCFCE7", color: "#15803D", padding: "2px 6px", borderRadius: "4px" }}>
                      LIVE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
