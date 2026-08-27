"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ClientOption {
  id: string;
  name: string;
  domain: string;
}

export default function MetaGeneratorPage() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [targetQuery, setTargetQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("None");
  const [country, setCountry] = useState("United Kingdom");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Editor states
  const [activeTab, setActiveTab] = useState<"title" | "description">("title");
  const [titleText, setTitleText] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
        }
      } catch (err) {
        console.error("Failed to load clients:", err);
      }
    };
    fetchClients();
  }, []);

  // Compute pixel width approximations (standard Arial 18px title width estimation)
  const titlePixelWidth = useMemo(() => {
    if (!titleText) return 0;
    // Average 10px per character for standard title font
    return Math.round(titleText.length * 9.5);
  }, [titleText]);

  const isTitleTruncated = titlePixelWidth > 580;
  const visibleTitle = isTitleTruncated && titleText.length > 55 ? titleText.slice(0, 55) : titleText;
  const truncatedTitlePart = isTitleTruncated && titleText.length > 55 ? titleText.slice(55) : "";

  const isDescTruncated = descriptionText.length > 160;
  const visibleDesc = isDescTruncated ? descriptionText.slice(0, 160) : descriptionText;
  const truncatedDescPart = isDescTruncated ? descriptionText.slice(160) : "";

  const currentDomain = useMemo(() => {
    if (selectedClientId === "None") return "example.com";
    const cl = clients.find(c => c.id === selectedClientId);
    return cl?.domain?.replace(/^https?:\/\//, "").replace(/\/$/, "") || "example.com";
  }, [selectedClientId, clients]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetQuery.trim()) return;

    setAnalyzing(true);
    try {
      const res = await fetch("/api/onpage/meta/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: targetQuery,
          clientId: selectedClientId,
          country
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
        if (!titleText && data.generatedSuggestions?.[0]?.title) {
          setTitleText(data.generatedSuggestions[0].title);
          setDescriptionText(data.generatedSuggestions[0].description);
        }
      }
    } catch (err) {
      console.error("Failed to analyze SERP:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateOptions = () => {
    if (analysisResult?.generatedSuggestions?.[0]) {
      const next = analysisResult.generatedSuggestions[Math.floor(Math.random() * analysisResult.generatedSuggestions.length)];
      setTitleText(next.title);
      setDescriptionText(next.description);
    } else {
      setTitleText(`${targetQuery.charAt(0).toUpperCase() + targetQuery.slice(1)} | Official Guide & Top Rates`);
      setDescriptionText(`Discover everything you need to know about ${targetQuery}. Get high quality solutions, verified reviews, and free instant estimates today.`);
    }
  };

  const gradeScore = useMemo(() => {
    if (!titleText && !descriptionText) return null;
    let score = 50;
    if (titleText.length >= 30 && titleText.length <= 60) score += 25;
    if (descriptionText.length >= 100 && descriptionText.length <= 160) score += 25;
    return score;
  }, [titleText, descriptionText]);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* Breadcrumb & Title */}
        <div style={{ marginBottom: "24px" }}>
          <Link href="/admin/onpage" style={{ color: "#64748B", fontSize: "13px", textDecoration: "none", display: "inline-block", marginBottom: "4px" }}>
            &larr; On-Page Tools
          </Link>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Meta Generator
          </h1>
          <p style={{ color: "#64748B", fontSize: "13.5px", margin: 0, lineHeight: "1.5" }}>
            Read the titles and descriptions already ranking for a query, see exactly why they work, then write and grade your own. The title wins the ranking; the description wins the click.
          </p>
        </div>

        {/* Input Bar Card */}
        <form onSubmit={handleAnalyze} style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "16px", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Target query
              </label>
              <input
                type="text"
                value={targetQuery}
                onChange={(e) => setTargetQuery(e.target.value)}
                placeholder="what people actually search for"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "13px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "6px",
                  background: "white",
                  outline: "none",
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "13px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "6px",
                  background: "white",
                  outline: "none",
                }}
              >
                <option value="None">None</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "13px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "6px",
                  background: "white",
                  outline: "none",
                }}
              >
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={analyzing}
              style={{
                background: "#0F172A",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "9px 18px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap"
              }}
            >
              {analyzing ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}
              Analyse the SERP
            </button>
          </div>
        </form>

        {/* Editor Box */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          
          {/* Tabs */}
          <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid #E2E8F0", marginBottom: "20px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("title")}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === "title" ? "2px solid #0F4C5C" : "none",
                color: activeTab === "title" ? "#0F172A" : "#64748B",
                fontWeight: activeTab === "title" ? "700" : "500",
                fontSize: "14px",
                paddingBottom: "10px",
                cursor: "pointer"
              }}
            >
              Title
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("description")}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === "description" ? "2px solid #0F4C5C" : "none",
                color: activeTab === "description" ? "#0F172A" : "#64748B",
                fontWeight: activeTab === "description" ? "700" : "500",
                fontSize: "14px",
                paddingBottom: "10px",
                cursor: "pointer"
              }}
            >
              Description
            </button>
          </div>

          {/* Inputs */}
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              placeholder="Write or paste the title tag"
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "13.5px",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                background: "white",
                outline: "none",
                marginBottom: "12px"
              }}
            />

            <textarea
              value={descriptionText}
              onChange={(e) => setDescriptionText(e.target.value)}
              placeholder="Write or paste the meta description"
              rows={3}
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "13.5px",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                background: "white",
                outline: "none",
                resize: "vertical"
              }}
            />
          </div>

          {/* Live SERP Preview Box */}
          <div style={{ background: "#FAFAFA", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px", marginBottom: "24px" }}>
            <div style={{ fontSize: "12px", color: "#202124", marginBottom: "2px" }}>
              {currentDomain}
            </div>
            <div style={{ fontSize: "18px", color: "#1A0DAB", fontWeight: "400", lineHeight: "1.3", marginBottom: "4px" }}>
              {titleText ? (
                <>
                  <span>{visibleTitle}</span>
                  {truncatedTitlePart && (
                    <span style={{ color: "#94A3B8" }}>{truncatedTitlePart}</span>
                  )}
                </>
              ) : (
                <span style={{ color: "#1A0DAB" }}>Your title appears here</span>
              )}
            </div>
            <div style={{ fontSize: "13px", color: "#4D5156", lineHeight: "1.4" }}>
              {descriptionText ? (
                <>
                  <span>{visibleDesc}</span>
                  {truncatedDescPart && (
                    <span style={{ color: "#94A3B8" }}>{truncatedDescPart}</span>
                  )}
                </>
              ) : (
                <span>Your description appears here. Greyed text is what Google cuts.</span>
              )}
            </div>

            {/* Pixel width ruler bar */}
            <div style={{ marginTop: "14px", borderTop: "1px dashed #CBD5E1", paddingTop: "6px", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8" }}>
              <span>0px</span>
              <span style={{ color: titlePixelWidth > 580 ? "#DC2626" : "#64748B", fontWeight: "600" }}>
                {titlePixelWidth}px / 580px cutoff {titlePixelWidth > 580 ? "(Truncated on SERP)" : ""}
              </span>
            </div>
          </div>

          {/* Grading & Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: gradeScore ? "#ECFDF5" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: gradeScore ? "#059669" : "#94A3B8" }}>
                {gradeScore ? `${gradeScore}%` : "—"}
              </div>
              <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#334155" }}>
                {gradeScore ? (gradeScore >= 80 ? "Excellent SERP presentation" : "Good, minor adjustments recommended") : "Nothing to grade yet"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleGenerateOptions}
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "7px 16px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Sparkles size={14} /> Generate options
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
