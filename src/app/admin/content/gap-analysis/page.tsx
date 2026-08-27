"use client";

import { useState } from "react";
import Link from "next/link";

export default function GlobalGapAnalysisPage() {
  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "28px 0 80px 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0" }}>
            Content Gap Analysis
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748B", margin: 0 }}>
            Competitor ranking gap intelligence and untargeted organic keywords.
          </p>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "40px", textAlign: "center", color: "#64748B" }}>
          Competitor gap scanner runs weekly across all tracked client domains.
        </div>
      </div>
    </div>
  );
}
