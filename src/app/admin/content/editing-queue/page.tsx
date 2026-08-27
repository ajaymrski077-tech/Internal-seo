"use client";

import { useState } from "react";
import Link from "next/link";

export default function GlobalEditingQueuePage() {
  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "28px 0 80px 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0" }}>
            Editing Queue
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748B", margin: 0 }}>
            Articles currently in human editing and proofreading stage.
          </p>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "40px", textAlign: "center", color: "#64748B" }}>
          The editing queue is currently clear.
        </div>
      </div>
    </div>
  );
}
