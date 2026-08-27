"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Search, RefreshCw, Loader2, MessageSquare, Send, Check } from "lucide-react";

interface ReplyThread {
  id: string;
  sender: string;
  time: string;
  campaign: string;
  snippet: string;
  client: string;
  category: string;
  fullMessage: string;
}

interface InboxData {
  totalReplies: number;
  clientPills: string[];
  categoryPills: string[];
  threads: ReplyThread[];
}

export default function ReplyInboxPage() {
  const [data, setData] = useState<InboxData | null>(null);
  const [tab, setTab] = useState<"Open" | "Done" | "Archived" | "All">("Open");
  const [selectedClient, setSelectedClient] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInbox = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/links/replies?client=${selectedClient}&category=${selectedCategory}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.threads?.length > 0 && !activeThreadId) {
            setActiveThreadId(json.threads[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load replies:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInbox();
  }, [selectedClient, selectedCategory]);

  const activeThread = data?.threads.find(t => t.id === activeThreadId);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <PageLoader message="Loading..." showSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
        Replies inbox unavailable.
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: "1500px", margin: "0 auto" }}>
        
        {/* Main Grid: Left Sidebar & Right Thread Viewer */}
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "20px", height: "calc(100vh - 100px)" }}>
          
          {/* Left Column: Inbox List */}
          <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            
            {/* Header & Status Tabs */}
            <div style={{ padding: "16px", borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h1 style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                  Reply Inbox
                </h1>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  {data.totalReplies} replies
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "inline-flex", background: "#F1F5F9", borderRadius: "6px", padding: "2px" }}>
                  {(["Open", "Done", "Archived", "All"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      style={{
                        background: tab === t ? "#0F4C5C" : "transparent",
                        color: tab === t ? "white" : "#64748B",
                        border: "none",
                        borderRadius: "4px",
                        padding: "3px 10px",
                        fontSize: "11.5px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  style={{
                    background: "white",
                    border: "1px solid #CBD5E1",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "11.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <RefreshCw size={11} /> Sync
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <Search size={13} style={{ position: "absolute", left: "10px", top: "9px", color: "#94A3B8" }} />
                <input
                  type="text"
                  placeholder="Search replies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 10px 6px 30px",
                    fontSize: "12px",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    background: "white",
                    outline: "none"
                  }}
                />
              </div>

              {/* Client & Campaign Dropdowns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                <select style={{ padding: "4px 8px", fontSize: "11.5px", border: "1px solid #CBD5E1", borderRadius: "4px" }}>
                  <option>All Clients</option>
                </select>
                <select style={{ padding: "4px 8px", fontSize: "11.5px", border: "1px solid #CBD5E1", borderRadius: "4px" }}>
                  <option>All Campaigns</option>
                </select>
              </div>

              {/* Client Filter Pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
                {data.clientPills.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedClient(c)}
                    style={{
                      background: selectedClient === c ? "#0F4C5C" : "#F1F5F9",
                      color: selectedClient === c ? "white" : "#475569",
                      border: "none",
                      borderRadius: "10px",
                      padding: "2px 8px",
                      fontSize: "10.5px",
                      fontWeight: "500",
                      cursor: "pointer"
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Category Pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {data.categoryPills.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: selectedCategory === cat ? "#0F4C5C" : "#F8FAFC",
                      color: selectedCategory === cat ? "white" : "#64748B",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "1px 7px",
                      fontSize: "10px",
                      fontWeight: "500",
                      cursor: "pointer"
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Thread List */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {data.threads.map((t) => {
                const isSelected = t.id === activeThreadId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveThreadId(t.id)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #F1F5F9",
                      background: isSelected ? "#F0FDFA" : "white",
                      borderLeft: isSelected ? "3px solid #0F4C5C" : "3px solid transparent",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>
                        {t.sender}
                      </span>
                      <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                        {t.time}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: "600", color: "#0F766E", marginBottom: "4px" }}>
                      {t.campaign}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.snippet}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Thread View */}
          <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {activeThread ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                
                {/* Header */}
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                      {activeThread.sender} &middot; <span style={{ color: "#64748B", fontWeight: "400" }}>{activeThread.client}</span>
                    </h2>
                    <span style={{ background: "#EFF6FF", color: "#1D4ED8", fontSize: "11px", fontWeight: "600", padding: "1px 6px", borderRadius: "4px" }}>
                      {activeThread.campaign}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button style={{ background: "#059669", color: "white", border: "none", borderRadius: "4px", padding: "5px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                      Mark as Done
                    </button>
                    <button style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "5px 12px", fontSize: "12px", cursor: "pointer" }}>
                      Archive
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div style={{ flex: 1, padding: "24px", overflowY: "auto", background: "#F8FAFC" }}>
                  <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "20px", maxWidth: "700px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>
                      <span style={{ fontWeight: "700", color: "#0F172A", fontSize: "13px" }}>{activeThread.sender}</span>
                      <span style={{ color: "#94A3B8", fontSize: "11.5px" }}>{activeThread.time}</span>
                    </div>
                    <p style={{ whiteSpace: "pre-wrap", color: "#334155", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                      {activeThread.fullMessage}
                    </p>
                  </div>
                </div>

                {/* Reply Box */}
                <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", background: "white" }}>
                  <textarea
                    rows={3}
                    placeholder="Write a response..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      fontSize: "13px",
                      border: "1px solid #CBD5E1",
                      borderRadius: "6px",
                      outline: "none",
                      marginBottom: "10px",
                      fontFamily: "inherit"
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      style={{
                        background: "#0F4C5C",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "7px 16px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <Send size={13} /> Send Reply
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: "#94A3B8" }}>
                <MessageSquare size={48} strokeWidth={1} style={{ marginBottom: "12px", color: "#CBD5E1" }} />
                <div style={{ fontSize: "15px", fontWeight: "600", color: "#475569" }}>Select a reply to view the thread</div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>{data.totalReplies} replies waiting in your inbox</div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
