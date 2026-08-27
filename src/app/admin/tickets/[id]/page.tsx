"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Send, Paperclip } from "lucide-react";
import { useToast } from "@/components/ToastContext";
import PageLoader from "@/components/PageLoader";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  client?: { name: string };
  senderEmail?: string;
  createdAt: string;
  body: string;
}

export default function TicketDetailPage() {
  const router = useRouter();
  const rawParams = useParams();
  const id = (rawParams?.id as string);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Open");
  const [assignedTo, setAssignedTo] = useState("Unassigned");
  const [activeTab, setActiveTab] = useState<"client" | "internal">("client");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { toast, success, error: toastError } = useToast();

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
        setStatus(data.status || "Open");
      }
    } catch (err) {
      console.error("Failed to fetch ticket", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = () => {
    success(`Ticket status updated to ${status}`);
  };

  const handleAssign = () => {
    success(`Ticket assigned to ${assignedTo}`);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this ticket?")) {
      success("Ticket deleted.");
      router.push("/admin/tickets");
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      success(activeTab === "client" ? "Reply sent to client!" : "Internal note saved!");
      setReplyText("");
    }, 400);
  };

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "28px 0 80px 0" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TOP BREADCRUMB */}
        <div style={{ marginBottom: "16px" }}>
          <Link
            href="/admin/tickets"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#64748B", textDecoration: "none" }}
          >
            <ArrowLeft size={14} />
            Back to tickets
          </Link>
        </div>

        {loading ? (
          <PageLoader message="Loading Ticket" subtitle="Fetching ticket details" showSkeleton />
        ) : !ticket ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748B", background: "white", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            Ticket not found.
          </div>
        ) : (
          <>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              
              <h1 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0F172A", margin: "0 0 8px 0" }}>
                {ticket.subject || "No Subject"}
              </h1>

              <div style={{ fontSize: "0.775rem", color: "#64748B", display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "18px" }}>
                <span><strong>Client:</strong> {ticket.client?.name || "Unknown"}</span>
                <span><strong>From:</strong> {ticket.senderEmail || "Unknown"}</span>
                <span><strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}</span>
              </div>

              {/* Status Bar Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
                <span style={{ fontSize: "0.725rem", fontWeight: "700", padding: "3px 8px", borderRadius: "4px", background: "#F1F5F9", color: "#475569" }}>
                  normal
                </span>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ padding: "5px 10px", borderRadius: "4px", border: "1px solid #CBD5E1", fontSize: "0.775rem", color: "#334155" }}
                >
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Pending</option>
                  <option>Closed</option>
                </select>

                <button
                  onClick={handleUpdateStatus}
                  style={{ padding: "5px 12px", fontSize: "0.75rem", fontWeight: "600", color: "#334155", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "4px", cursor: "pointer" }}
                >
                  Update
                </button>

                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  style={{ padding: "5px 10px", borderRadius: "4px", border: "1px solid #CBD5E1", fontSize: "0.775rem", color: "#334155", marginLeft: "10px" }}
                >
                  <option>Unassigned</option>
                  <option>Mister SK - Dev Team</option>
                  <option>Content Lead</option>
                  <option>Account Manager</option>
                </select>

                <button
                  onClick={handleAssign}
                  style={{ padding: "5px 12px", fontSize: "0.75rem", fontWeight: "600", color: "#334155", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "4px", cursor: "pointer" }}
                >
                  Assign
                </button>

                <button
                  onClick={handleDelete}
                  style={{ marginLeft: "auto", padding: "5px 12px", fontSize: "0.75rem", fontWeight: "600", color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "4px", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>

            </div>

            {/* 3. THREAD MESSAGES */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              
              <div style={{ padding: "14px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "0.875rem", color: "#0F172A" }}>{ticket.client?.name || "Client"}</strong>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>

              <div style={{ padding: "20px" }}>
                <p style={{ fontSize: "0.8125rem", color: "#334155", lineHeight: "1.6", margin: "0 0 16px 0" }}>
                  {ticket.body || "No message provided."}
                </p>
              </div>

            </div>
          </>
        )}

        {/* 4. REPLY FORM */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          {/* Tabs: Reply to Client | Internal Note */}
          <div style={{ display: "flex", gap: "20px", borderBottom: "1px solid #E2E8F0", marginBottom: "16px" }}>
            <button
              onClick={() => setActiveTab("client")}
              style={{
                padding: "6px 0 10px 0",
                fontSize: "0.8125rem",
                fontWeight: activeTab === "client" ? "700" : "500",
                color: activeTab === "client" ? "#0F4C5C" : "#64748B",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "client" ? "2px solid #0F4C5C" : "2px solid transparent",
                cursor: "pointer"
              }}
            >
              Reply to Client
            </button>
            <button
              onClick={() => setActiveTab("internal")}
              style={{
                padding: "6px 0 10px 0",
                fontSize: "0.8125rem",
                fontWeight: activeTab === "internal" ? "700" : "500",
                color: activeTab === "internal" ? "#0F4C5C" : "#64748B",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "internal" ? "2px solid #0F4C5C" : "2px solid transparent",
                cursor: "pointer"
              }}
            >
              Internal Note
            </button>
          </div>

          <form onSubmit={handleSendReply}>
            <textarea
              rows={4}
              required
              placeholder={activeTab === "client" ? "Type your reply to the client..." : "Add an internal team note (client will not see this)..."}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", outline: "none", resize: "vertical", marginBottom: "14px" }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => success("File attachment dialog opened")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#475569",
                  background: "#F1F5F9",
                  border: "1px solid #CBD5E1",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                <Paperclip size={13} />
                Attach files
              </button>

              <button
                type="submit"
                disabled={isSending}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 18px",
                  fontSize: "0.8125rem",
                  fontWeight: "600",
                  color: "#FFFFFF",
                  background: "#0F4C5C",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isSending ? "not-allowed" : "pointer"
                }}
              >
                <Send size={13} />
                {isSending ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
