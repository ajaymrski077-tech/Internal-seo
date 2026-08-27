"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, RefreshCw } from "lucide-react";
import styles from "@/styles/Reports.module.css";

export default function GlobalDraftsPage() {
  const [drafts, setDrafts] = useState<Array<{ id: string; title: string; targetKeyword: string; clientName: string; clientId: string; wordCount: number; stage: string }>>([]);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "28px 0 80px 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0" }}>
            Drafts
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748B", margin: 0 }}>
            Active drafts across all client sites.
          </p>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "40px", textAlign: "center", color: "#64748B" }}>
          No active drafts in the system. Create an idea and generate a draft in any client pipeline.
        </div>
      </div>
    </div>
  );
}
