"use client";

import { useState } from "react";
import Link from "next/link";

export default function GlobalLibraryPage() {
  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "28px 0 80px 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0" }}>
            Content Library
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748B", margin: 0 }}>
            Archive of published assets and landing pages across all client domains.
          </p>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "40px", textAlign: "center", color: "#64748B" }}>
          Content library archive is synchronized with live publishing events.
        </div>
      </div>
    </div>
  );
}
