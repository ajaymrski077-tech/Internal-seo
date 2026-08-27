"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/components/ToastContext";

export default function NewIdeaPage() {
  const router = useRouter();
  const rawParams = useParams();
  const clientId = (rawParams?.clientId as string) || "";

  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [cluster, setCluster] = useState("");
  const [searchFrom, setSearchFrom] = useState("United Kingdom");
  const [pageType, setPageType] = useState<"info" | "service">("info");
  const [tier, setTier] = useState("Commodity");
  const [contentType, setContentType] = useState("Blog post");
  const [intent, setIntent] = useState("Auto-classify from the SERP");
  const [isLocal, setIsLocal] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast, success, error: toastError } = useToast();

  const handleSuggest = () => {
    if (!keyword) {
      toastError("Please enter a target keyword first.");
      return;
    }
    const words = keyword.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    setTitle(`Complete Guide: ${words}`);
    success("AI generated headline suggestion!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/content/client/${clientId}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKeyword: keyword,
          title: title || keyword,
          cluster: cluster || undefined,
          tier: tier.toLowerCase(),
          contentType,
          intent,
          isLocal,
          notes: notes || undefined,
          isServicePage: pageType === "service",
        }),
      });
      if (!res.ok) throw new Error("Failed to create idea.");
      success("New idea created!");
      router.push(`/admin/content/${clientId}/ideas`);
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "24px 0 80px 0" }}>
      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TOP BREADCRUMB */}
        <div style={{ marginBottom: "12px" }}>
          <Link
            href={`/admin/content/${clientId}/ideas`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#64748B", textDecoration: "none" }}
          >
            <ArrowLeft size={14} />
            Back to ideas
          </Link>
        </div>

        {/* 2. TITLE */}
        <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: "0 0 20px 0", letterSpacing: "-0.5px" }}>
          New Idea
        </h1>

        {/* 3. FORM CARD */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Main Card */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            
            {/* Target Keyword with green left highlight */}
            <div style={{ borderLeft: "4px solid #10B981", paddingLeft: "14px" }}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                Target keyword *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. how long does it take to fit a new boiler"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none" }}
              />
              <div style={{ fontSize: "0.725rem", color: "#64748B", marginTop: "4px", lineHeight: "1.3" }}>
                Everything downstream is built on this: the SERP analysis, the sub-query fan-out, which competitors get crawled, and the outline. Write it the way someone would search.
              </div>
            </div>

            {/* Title with Suggest Button */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: "700", color: "#334155" }}>
                  Title <span style={{ fontSize: "0.6875rem", color: "#94A3B8", fontWeight: "400" }}>OPTIONAL</span>
                </label>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Leave blank to use the keyword"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ flex: 1, padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none" }}
                />
                <button
                  type="button"
                  onClick={handleSuggest}
                  style={{ padding: "9px 14px", fontSize: "0.8125rem", fontWeight: "600", color: "#334155", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "6px", cursor: "pointer" }}
                >
                  Suggest
                </button>
              </div>
              <div style={{ fontSize: "0.725rem", color: "#94A3B8", marginTop: "4px" }}>
                A working label for the backlog. The brief writes the real title tag and H1 later.
              </div>
            </div>

            {/* Cluster */}
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                Cluster
              </label>
              <select
                value={cluster}
                onChange={(e) => setCluster(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", color: "#334155" }}
              >
                <option value="">— None —</option>
                <option value="Boiler Replacement">Boiler Replacement</option>
                <option value="Heating & Repairs">Heating & Repairs</option>
                <option value="Emergency Plumbing">Emergency Plumbing</option>
              </select>
            </div>

            {/* Search From */}
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                Search from
              </label>
              <select
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", color: "#334155" }}
              >
                <option value="United Kingdom">— use the client&apos;s market —</option>
                <option value="London, United Kingdom">London, United Kingdom</option>
                <option value="Edinburgh, United Kingdom">Edinburgh, United Kingdom</option>
                <option value="Bristol, England, United Kingdom">Bristol, England, United Kingdom</option>
              </select>
            </div>

            {/* Page Type (Radio Cards) */}
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
                Page type
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                
                {/* Info / Blog */}
                <div
                  onClick={() => setPageType("info")}
                  style={{
                    border: pageType === "info" ? "2px solid #0F4C5C" : "1px solid #E2E8F0",
                    background: pageType === "info" ? "#F0FDFA" : "#FFFFFF",
                    borderRadius: "8px",
                    padding: "14px",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                    <input type="radio" name="pageType" checked={pageType === "info"} readOnly />
                    Info / blog
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748B", lineHeight: "1.3" }}>
                    Educational content: cost guides, how-tos, comparisons. The reader is researching, not buying yet.
                  </div>
                </div>

                {/* Service Page */}
                <div
                  onClick={() => setPageType("service")}
                  style={{
                    border: pageType === "service" ? "2px solid #0F4C5C" : "1px solid #E2E8F0",
                    background: pageType === "service" ? "#F0FDFA" : "#FFFFFF",
                    borderRadius: "8px",
                    padding: "14px",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                    <input type="radio" name="pageType" checked={pageType === "service"} readOnly />
                    Service page
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748B", lineHeight: "1.3" }}>
                    Sells a specific service. Locally targeted, conversion-focused, written from the business profile and reviews.
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Classification Sub-Card */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
              CLASSIFICATION
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Content tier
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem" }}
                >
                  <option value="Commodity">Commodity</option>
                  <option value="Enhanced">Enhanced</option>
                  <option value="Story">Story</option>
                </select>
                <div style={{ fontSize: "0.725rem", color: "#94A3B8", marginTop: "4px" }}>
                  How much effort the piece earns. Commodity answers a known question.
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Content type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem" }}
                >
                  <option value="Blog post">Blog post</option>
                  <option value="Comparison">Comparison</option>
                  <option value="FAQ">FAQ</option>
                  <option value="Location page">Location page</option>
                  <option value="Calculator">Calculator</option>
                </select>
                <div style={{ fontSize: "0.725rem", color: "#94A3B8", marginTop: "4px" }}>
                  The shape of the finished page.
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "center" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Intent <span style={{ fontSize: "0.6875rem", color: "#94A3B8", fontWeight: "400" }}>OPTIONAL</span>
                </label>
                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem" }}
                >
                  <option value="Auto-classify from the SERP">Auto-classify from the SERP</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Informational">Informational</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
                  Local
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem", color: "#334155", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isLocal}
                    onChange={(e) => setIsLocal(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  <strong>Location-qualified keyword</strong>
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                Notes (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Any special client instructions or angles..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none", resize: "vertical" }}
              />
            </div>

          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "10px 24px",
                fontSize: "0.875rem",
                fontWeight: "700",
                color: "#FFFFFF",
                background: "#10B981",
                border: "none",
                borderRadius: "6px",
                cursor: isSubmitting ? "not-allowed" : "pointer"
              }}
            >
              {isSubmitting ? "Creating..." : "Create idea"}
            </button>
            <Link
              href={`/admin/content/${clientId}/ideas`}
              style={{
                padding: "10px 18px",
                fontSize: "0.875rem",
                color: "#64748B",
                textDecoration: "none"
              }}
            >
              Cancel
            </Link>
          </div>

        </form>

      </div>
    </div>
  );
}
