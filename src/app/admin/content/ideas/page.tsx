"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, Copy, Check } from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";

interface GlobalIdea {
  id: string;
  displayId: number;
  title: string;
  targetKeyword: string;
  clientId: string;
  clientName: string;
  outlineText: string;
  hasOutline: boolean;
  hasBrief: boolean;
  draftNumber: number | null;
  lastRun: string;
}

export default function GlobalIdeasPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<GlobalIdea[]>([]);
  const [activeFilter, setActiveFilter] = useState<"outline" | "all">("outline");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { toast, success, error: toastError } = useToast();

  const mockIdeas: GlobalIdea[] = [
    {
      id: "324",
      displayId: 324,
      title: "MTD for Landlords: What you need to know",
      targetKeyword: "making tax digital for landlords",
      clientId: "1",
      clientName: "Brockwood",
      outlineText: "8 H2 / 15 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 243,
      lastRun: "2026-08-25 09:44",
    },
    {
      id: "323",
      displayId: 323,
      title: "Hampstead Heath: Walks, Ponds and Viewpoints",
      targetKeyword: "hampstead heath",
      clientId: "2",
      clientName: "Veeve",
      outlineText: "8 H2 / 5 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 240,
      lastRun: "2026-08-25 01:17",
    },
    {
      id: "322",
      displayId: 322,
      title: "What Is a Virtual Finance Director?",
      targetKeyword: "virtual fd",
      clientId: "1",
      clientName: "Brockwood",
      outlineText: "6 H2 / 2 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 242,
      lastRun: "2026-08-25 08:23",
    },
    {
      id: "321",
      displayId: 321,
      title: "gdpr business to business",
      targetKeyword: "B2B Telemarketing GDPR",
      clientId: "3",
      clientName: "Novus BC",
      outlineText: "9 H2 / 8 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 238,
      lastRun: "2026-08-24 08:39",
    },
    {
      id: "315",
      displayId: 315,
      title: "What Your Water Bill Is Telling You About Hidden Leaks",
      targetKeyword: "high water bill no visible leak",
      clientId: "4",
      clientName: "Evolution Plumbing",
      outlineText: "9 H2 / 11 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 241,
      lastRun: "2026-08-25 04:21",
    },
    {
      id: "314",
      displayId: 314,
      title: "How Plumbers Actually Find Hidden Leaks",
      targetKeyword: "plumbing leak detection",
      clientId: "4",
      clientName: "Evolution Plumbing",
      outlineText: "6 H2 / 6 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 237,
      lastRun: "2026-08-22 03:28",
    },
    {
      id: "313",
      displayId: 313,
      title: "Why Your Drains Smell Worse in an Arizona Summer",
      targetKeyword: "p trap smell",
      clientId: "4",
      clientName: "Evolution Plumbing",
      outlineText: "6 H2 / 5 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 236,
      lastRun: "2026-08-21 21:24",
    },
    {
      id: "312",
      displayId: 312,
      title: "Tree Roots in Sewer Lines: The East Valley's Usual Suspects",
      targetKeyword: "tree roots in sewer lines",
      clientId: "4",
      clientName: "Evolution Plumbing",
      outlineText: "7 H2 / 4 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 235,
      lastRun: "2026-08-21 17:24",
    },
    {
      id: "311",
      displayId: 311,
      title: "Chemical Drain Cleaners: What They Actually Do to Your Pipes",
      targetKeyword: "is drain cleaner safe for pipes",
      clientId: "4",
      clientName: "Evolution Plumbing",
      outlineText: "8 H2 / 11 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 234,
      lastRun: "2026-08-21 05:15",
    },
    {
      id: "310",
      displayId: 310,
      title: "Drain Cleaning vs Hydro Jetting: Which One Do You Actually Need",
      targetKeyword: "hydro jetting vs traditional drain cleaning",
      clientId: "4",
      clientName: "Evolution Plumbing",
      outlineText: "5 H2 / 11 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 233,
      lastRun: "2026-08-21 04:30",
    },
    {
      id: "303",
      displayId: 303,
      title: "Market Research as a B2B Growth Tool",
      targetKeyword: "b2b market research",
      clientId: "3",
      clientName: "Novus BC",
      outlineText: "9 H2 / 7 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 230,
      lastRun: "2026-08-19 12:54",
    },
    {
      id: "287",
      displayId: 287,
      title: "Montmartre in Winter: A Guide to the 18th Arrondissement",
      targetKeyword: "Montmartre",
      clientId: "2",
      clientName: "Veeve",
      outlineText: "7 H2 / 14 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 232,
      lastRun: "2026-08-24 20:27",
    },
    {
      id: "283",
      displayId: 283,
      title: "A Local's Guide to Portobello Road Market",
      targetKeyword: "Portobello Road Market in London",
      clientId: "2",
      clientName: "Veeve",
      outlineText: "5 H2 / 4 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 229,
      lastRun: "2026-08-19 04:22",
    },
    {
      id: "282",
      displayId: 282,
      title: "How to Spend Christmas in Kensington and Chelsea",
      targetKeyword: "Christmas in Kensington and Chelsea",
      clientId: "2",
      clientName: "Veeve",
      outlineText: "5 H2 / 11 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 228,
      lastRun: "2026-08-18 23:50",
    },
    {
      id: "281",
      displayId: 281,
      title: "colocation racks",
      targetKeyword: "colocation racks",
      clientId: "5",
      clientName: "Datum",
      outlineText: "9 H2 / 5 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 231,
      lastRun: "2026-08-20 00:47",
    },
    {
      id: "280",
      displayId: 280,
      title: "What's Driving the UK Data Centre Market?",
      targetKeyword: "uk data centre market",
      clientId: "5",
      clientName: "Datum",
      outlineText: "8 H2 / 7 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 224,
      lastRun: "2026-08-17 20:28",
    },
    {
      id: "279",
      displayId: 279,
      title: "What Is Cloud Repatriation and Why Are UK Businesses Doing It?",
      targetKeyword: "cloud repatriation",
      clientId: "5",
      clientName: "Datum",
      outlineText: "8 H2 / 8 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 223,
      lastRun: "2026-08-14 22:21",
    },
    {
      id: "276",
      displayId: 276,
      title: "What Is a Meet Me Room?",
      targetKeyword: "meet me room",
      clientId: "5",
      clientName: "Datum",
      outlineText: "4 H2 / 11 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 222,
      lastRun: "2026-08-13 23:02",
    },
    {
      id: "275",
      displayId: 275,
      title: "What is Colocation? A Guide for UK businesses",
      targetKeyword: "what is colocation",
      clientId: "5",
      clientName: "Datum",
      outlineText: "7 H2 / 14 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 221,
      lastRun: "2026-08-13 16:45",
    },
    {
      id: "274",
      displayId: 274,
      title: "Is That a Leak? Check Your Gilbert Water Meter in Five Minutes",
      targetKeyword: "how to spot a water meter leak",
      clientId: "4",
      clientName: "Evolution Plumbing",
      outlineText: "7 H2 / 6 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 220,
      lastRun: "2026-08-13 03:15",
    },
    {
      id: "273",
      displayId: 273,
      title: "Do I Need a Water Softener in Gilbert Arizona",
      targetKeyword: "Water Softener in Gilbert",
      clientId: "4",
      clientName: "Evolution Plumbing",
      outlineText: "8 H2 / 12 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 219,
      lastRun: "2026-08-13 02:29",
    },
    {
      id: "272",
      displayId: 272,
      title: "Gas vs Electric Water Heaters: Which is Right for East Valley Homes",
      targetKeyword: "Gas vs Electric Water Heaters",
      clientId: "4",
      clientName: "Evolution Plumbing",
      outlineText: "7 H2 / 11 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 218,
      lastRun: "2026-08-12 21:00",
    },
    {
      id: "271",
      displayId: 271,
      title: "Do Tankless Water Heaters Work with Hard Water in Arizona?",
      targetKeyword: "Tankless Water Heaters and Arizona Hard Water",
      clientId: "4",
      clientName: "Evolution Plumbing",
      outlineText: "5 H2 / 13 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 217,
      lastRun: "2026-08-12 18:28",
    },
    {
      id: "270",
      displayId: 270,
      title: "How Long Should a Water Heater Last in Arizona?",
      targetKeyword: "How Long Should a Water Heater Last in Arizona?",
      clientId: "4",
      clientName: "Evolution Plumbing",
      outlineText: "6 H2 / 11 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 216,
      lastRun: "2026-08-12 16:45",
    },
    {
      id: "268",
      displayId: 268,
      title: "No Hot Water? Here's What to Do",
      targetKeyword: "no hot water",
      clientId: "4",
      clientName: "Evolution Plumbing",
      outlineText: "8 H2 / 4 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 215,
      lastRun: "2026-08-12 13:30",
    },
    {
      id: "266",
      displayId: 266,
      title: "SEO for Dentists: A Practical Guide",
      targetKeyword: "seo for dentists",
      clientId: "6",
      clientName: "Arken Digital",
      outlineText: "6 H2 / 12 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 214,
      lastRun: "2026-08-10 15:40",
    },
    {
      id: "265",
      displayId: 265,
      title: "SEO for Plumbers: A Practical Guide",
      targetKeyword: "seo for plumbers",
      clientId: "6",
      clientName: "Arken Digital",
      outlineText: "6 H2 / 14 H3",
      hasOutline: true,
      hasBrief: true,
      draftNumber: 213,
      lastRun: "2026-08-07 15:29",
    },
  ];

  const fetchGlobalIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/ideas?hasOutline=${activeFilter === "outline"}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.ideas && json.ideas.length > 0) {
          setIdeas(json.ideas);
        } else {
          setIdeas(mockIdeas);
        }
      } else {
        setIdeas(mockIdeas);
      }
    } catch {
      setIdeas(mockIdeas);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, search]);

  useEffect(() => {
    fetchGlobalIdeas();
  }, [fetchGlobalIdeas]);

  const handleCopyIdea = (item: GlobalIdea) => {
    const textToCopy = `${item.title}\nTarget Keyword: ${item.targetKeyword}\nOutline: ${item.outlineText || "8 H2 / 10 H3"}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    success(`Outline copied for "${item.title}"!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredIdeas = ideas.filter((item) => {
    if (!search) return true;
    return (
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.targetKeyword.toLowerCase().includes(search.toLowerCase()) ||
      item.clientName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "28px 0 80px 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TITLE & SUBTITLE */}
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
            Ideas
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
            {ideas.length} ideas with an approved outline
          </p>
        </div>

        {/* 2. FILTER BUTTONS */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            onClick={() => setActiveFilter("outline")}
            style={{
              padding: "6px 14px",
              fontSize: "0.8125rem",
              fontWeight: "700",
              borderRadius: "4px",
              border: "none",
              background: activeFilter === "outline" ? "#0F172A" : "#FFFFFF",
              color: activeFilter === "outline" ? "#FFFFFF" : "#64748B",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
            }}
          >
            Has an outline ({ideas.length})
          </button>
          <button
            onClick={() => setActiveFilter("all")}
            style={{
              padding: "6px 14px",
              fontSize: "0.8125rem",
              fontWeight: "700",
              borderRadius: "4px",
              border: "none",
              background: activeFilter === "all" ? "#0F172A" : "#FFFFFF",
              color: activeFilter === "all" ? "#FFFFFF" : "#64748B",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
            }}
          >
            All ideas (298)
          </button>
        </div>

        {/* 3. INFO CALLOUT NOTE */}
        <div style={{ fontSize: "0.775rem", color: "#64748B", lineHeight: "1.5", marginBottom: "20px", maxWidth: "1140px" }}>
          Copy takes an idea as far as its outline: the outline tree, sub-queries, entities including required flags, and the competitor crawl. It does not copy the brief, the draft or any pipeline run, so the copy lands ready to generate a brief. Use it to test a brief or draft change without rebuilding an outline first.
        </div>

        {/* 4. SEARCH INPUT */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ position: "relative", width: "300px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search ideas, keywords, clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "7px 12px 7px 32px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#FFFFFF", fontSize: "0.8125rem", outline: "none" }}
            />
          </div>
        </div>

        {/* 5. TABLE */}
        <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "12px 20px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>IDEA</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>CLIENT</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>OUTLINE</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>BRIEF</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>DRAFT</th>
                <th style={{ padding: "12px 14px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>LAST RUN</th>
                <th style={{ padding: "12px 20px", fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredIdeas.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* IDEA */}
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "0.85rem" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "0.725rem", color: "#64748B", marginTop: "2px" }}>
                      #{item.displayId} · {item.targetKeyword}
                    </div>
                  </td>

                  {/* CLIENT */}
                  <td style={{ padding: "12px 14px" }}>
                    <Link
                      href={`/admin/content/${item.clientId}`}
                      style={{ fontSize: "0.8125rem", color: "#475569", textDecoration: "none" }}
                    >
                      {item.clientName}
                    </Link>
                  </td>

                  {/* OUTLINE */}
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: "0.725rem", fontWeight: "600", color: "#16A34A" }}>
                      {item.outlineText || "8 H2 / 10 H3"}
                    </span>
                  </td>

                  {/* BRIEF */}
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#16A34A" }}>
                      yes
                    </span>
                  </td>

                  {/* DRAFT */}
                  <td style={{ padding: "12px 14px" }}>
                    {item.draftNumber ? (
                      <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#0D9488" }}>
                        #{item.draftNumber}
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.8125rem", color: "#94A3B8" }}>—</span>
                    )}
                  </td>

                  {/* LAST RUN */}
                  <td style={{ padding: "12px 14px", fontSize: "0.775rem", color: "#64748B" }}>
                    {item.lastRun}
                  </td>

                  {/* COPY BUTTON */}
                  <td style={{ padding: "12px 20px", textAlign: "right" }}>
                    <button
                      onClick={() => handleCopyIdea(item)}
                      style={{
                        padding: "4px 12px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: "#334155",
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      {copiedId === item.id ? "Copied!" : "Copy"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
