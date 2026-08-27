"use client";

import Link from "next/link";
import { TrendingUp, Search, Map, Type } from "lucide-react";

export default function OnPageToolsPage() {
  const tools = [
    {
      id: "opportunities",
      title: "Opportunity worklist",
      description:
        "Which pages to work on next: every page already ranking in striking distance (positions ~4–20), ranked by the extra monthly clicks it could win. Straight from Search Console.",
      linkText: "See opportunities →",
      href: "/admin/onpage/opportunities",
      icon: TrendingUp,
      iconColor: "#8B5CF6",
      iconBg: "#F5F3FF",
      linkColor: "#4F46E5",
    },
    {
      id: "checker",
      title: "On-page checker",
      description:
        "Audit a single page against its target keyword and the live SERP competitors — where it ranks now, technical / keyword / content / trust checks, authority gap, plus AI recommendations.",
      linkText: "Open checker →",
      href: "/admin/onpage/audits",
      icon: Search,
      iconColor: "#3B82F6",
      iconBg: "#EFF6FF",
      linkColor: "#4F46E5",
    },
    {
      id: "mapping",
      title: "Keyword mapping",
      description:
        "Map the whole site: one target page per keyword cluster, checked against Search Console. Flags cannibalisation, tests one-page-or-two, and builds a fix plan.",
      linkText: "Open keyword mapping →",
      href: "/admin/onpage/mapping",
      icon: Map,
      iconColor: "#10B981",
      iconBg: "#ECFDF5",
      linkColor: "#0F4C5C",
    },
    {
      id: "meta",
      title: "Meta generator",
      description:
        "Read the titles already ranking for a query, spot the pattern, then write and grade your own. Measures rendered pixel width so you can see exactly what Google cuts, and flags the pages whose weak titles are costing the most clicks.",
      linkText: "Open title generator →",
      href: "/admin/onpage/meta",
      icon: Type,
      iconColor: "#0D9488",
      iconBg: "#F0FDFA",
      linkColor: "#4F46E5",
    },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "48px 32px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
            On-Page Tools
          </h1>
          <p style={{ color: "#64748B", fontSize: "14px", margin: 0, maxWidth: "700px", lineHeight: "1.5" }}>
            Four tools for on-page SEO: find the pages worth working on, work a single page, map the whole site, and write the titles that earn the click.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" }}>
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  padding: "32px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  minHeight: "220px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#CBD5E1";
                  e.currentTarget.style.boxShadow = "0 8px 16px -4px rgba(0,0,0,0.06)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: tool.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <Icon size={18} style={{ color: tool.iconColor }} />
                  </div>
                  <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0F172A", margin: "0 0 10px 0" }}>
                    {tool.title}
                  </h3>
                  <p style={{ color: "#64748B", fontSize: "13.5px", lineHeight: "1.5", margin: 0 }}>
                    {tool.description}
                  </p>
                </div>

                <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: tool.linkColor, fontSize: "13.5px", fontWeight: "600" }}>
                    {tool.linkText}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
