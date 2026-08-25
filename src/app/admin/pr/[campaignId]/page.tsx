"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Plus, X, AlertCircle, Trash2, Calendar, CheckCircle, ExternalLink, Globe, User, ShieldAlert, Award } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";
import modalStyles from "@/styles/ClientModal.module.css";

interface OutreachRecord {
  id: number;
  contactName: string;
  contactEmail: string | null;
  publicationName: string;
  targetUrl: string | null;
  outreachStatus: string;
  sentAt: string | null;
  followUpDate: string | null;
  respondedAt: string | null;
  notes: string | null;
}

interface Placement {
  id: number;
  publicationName: string;
  publicationUrl: string | null;
  articleTitle: string;
  articleUrl: string;
  publishedDate: string | null;
  targetUrl: string | null;
  linkType: string;
  notes: string | null;
  verifiedAt: string | null;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  dueDate: string | null;
}

interface ActivityLog {
  id: number;
  actorEmail: string;
  action: string;
  metadata: string | null;
  createdAt: string;
}

interface CampaignDetail {
  id: number;
  campaignName: string;
  clientId: number;
  client: { name: string };
  description: string | null;
  objective: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  targetDate: string | null;
  completedDate: string | null;
  budget: number | null;
  outreachRecords: OutreachRecord[];
  placements: Placement[];
  tasks: Task[];
  activityLogs: ActivityLog[];
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = parseInt(params.campaignId as string, 10);

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, outreach, placements, tasks, activity

  // Modals state
  const [isEditCampaignOpen, setIsEditCampaignOpen] = useState(false);
  const [isAddOutreachOpen, setIsAddOutreachOpen] = useState(false);
  const [isAddPlacementOpen, setIsAddPlacementOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Edit Campaign fields
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editObjective, setEditObjective] = useState("");
  const [editStatus, setEditStatus] = useState("DRAFT");
  const [editPriority, setEditPriority] = useState("NORMAL");
  const [editStartDate, setEditStartDate] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editBudget, setEditBudget] = useState("");

  // Outreach fields
  const [outPubName, setOutPubName] = useState("");
  const [outContactName, setOutContactName] = useState("");
  const [outContactEmail, setOutContactEmail] = useState("");
  const [outTargetUrl, setOutTargetUrl] = useState("");
  const [outStatus, setOutStatus] = useState("NOT_CONTACTED");
  const [outFollowUpDate, setOutFollowUpDate] = useState("");
  const [outNotes, setOutNotes] = useState("");

  // Placement fields
  const [placePubName, setPlacePubName] = useState("");
  const [placePubUrl, setPlacePubUrl] = useState("");
  const [placeTitle, setPlaceTitle] = useState("");
  const [placeUrl, setPlaceUrl] = useState("");
  const [placePubDate, setPlacePubDate] = useState("");
  const [placeTargetUrl, setPlaceTargetUrl] = useState("");
  const [placeLinkType, setPlaceLinkType] = useState("UNKNOWN");
  const [placeNotes, setPlaceNotes] = useState("");
  const [placeOutreachId, setPlaceOutreachId] = useState("");

  // Task fields
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("NORMAL");
  const [taskStatus, setTaskStatus] = useState("TODO");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchCampaignDetail = async () => {
    try {
      const res = await fetch(`/api/pr/campaigns/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
        // Pre-fill edit fields
        setEditName(data.campaignName);
        setEditDesc(data.description || "");
        setEditObjective(data.objective || "");
        setEditStatus(data.status);
        setEditPriority(data.priority);
        setEditStartDate(data.startDate ? new Date(data.startDate).toISOString().split("T")[0] : "");
        setEditTargetDate(data.targetDate ? new Date(data.targetDate).toISOString().split("T")[0] : "");
        setEditBudget(data.budget?.toString() || "");
      } else {
        router.push("/admin/pr");
      }
    } catch (err) {
      console.error("Failed to load campaign detail", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNaN(campaignId)) {
      fetchCampaignDetail();
    }
  }, [campaignId]);

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/pr/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: editName,
          description: editDesc,
          objective: editObjective,
          status: editStatus,
          priority: editPriority,
          startDate: editStartDate || null,
          targetDate: editTargetDate || null,
          budget: editBudget ? parseFloat(editBudget) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update campaign");
      }

      setIsEditCampaignOpen(false);
      fetchCampaignDetail();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCampaign = async () => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this PR campaign?");
    if (!confirmDelete) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/pr/campaigns/${campaignId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete campaign");
      router.push("/admin/pr");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outPubName.trim() || !outContactName.trim()) {
      setErrorMsg("Publication Name and Contact Name are required.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/pr/campaigns/${campaignId}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicationName: outPubName,
          contactName: outContactName,
          contactEmail: outContactEmail || null,
          targetUrl: outTargetUrl || null,
          outreachStatus: outStatus,
          followUpDate: outFollowUpDate || null,
          notes: outNotes || null,
          sentAt: outStatus !== "NOT_CONTACTED" ? new Date().toISOString() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add outreach");
      }

      setIsAddOutreachOpen(false);
      setOutPubName("");
      setOutContactName("");
      setOutContactEmail("");
      setOutTargetUrl("");
      setOutStatus("NOT_CONTACTED");
      setOutFollowUpDate("");
      setOutNotes("");
      fetchCampaignDetail();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickOutreachStatus = async (recordId: number, status: string) => {
    try {
      const res = await fetch(`/api/pr/outreach/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outreachStatus: status,
          ...(status === "CONTACTED" ? { sentAt: new Date().toISOString() } : {}),
          ...(status === "RESPONDED" ? { respondedAt: new Date().toISOString() } : {}),
        }),
      });
      if (res.ok) {
        fetchCampaignDetail();
      }
    } catch (err) {
      console.error("Failed to update outreach status", err);
    }
  };

  const handleDeleteOutreach = async (recordId: number) => {
    const confirmDelete = window.confirm("Are you sure you want to remove this outreach target?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/pr/outreach/${recordId}`, { method: "DELETE" });
      if (res.ok) fetchCampaignDetail();
    } catch (err) {
      console.error("Failed to delete outreach", err);
    }
  };

  const handleAddPlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placePubName.trim() || !placeTitle.trim() || !placeUrl.trim()) {
      setErrorMsg("Publication Name, Article Title, and Article URL are required.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/pr/campaigns/${campaignId}/placements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicationName: placePubName,
          publicationUrl: placePubUrl || null,
          articleTitle: placeTitle,
          articleUrl: placeUrl,
          publishedDate: placePubDate || null,
          targetUrl: placeTargetUrl || null,
          linkType: placeLinkType,
          notes: placeNotes || null,
          outreachId: placeOutreachId ? parseInt(placeOutreachId, 10) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add placement");
      }

      setIsAddPlacementOpen(false);
      setPlacePubName("");
      setPlacePubUrl("");
      setPlaceTitle("");
      setPlaceUrl("");
      setPlacePubDate("");
      setPlaceTargetUrl("");
      setPlaceLinkType("UNKNOWN");
      setPlaceNotes("");
      setPlaceOutreachId("");
      fetchCampaignDetail();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyPlacement = async (placementId: number, isVerified: boolean) => {
    try {
      const res = await fetch(`/api/pr/placements/${placementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: isVerified }),
      });
      if (res.ok) fetchCampaignDetail();
    } catch (err) {
      console.error("Failed to verify placement", err);
    }
  };

  const handleDeletePlacement = async (placementId: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this placement?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/pr/placements/${placementId}`, { method: "DELETE" });
      if (res.ok) fetchCampaignDetail();
    } catch (err) {
      console.error("Failed to delete placement", err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setErrorMsg("Task title is required.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc.trim() || null,
          status: taskStatus,
          priority: taskPriority,
          assignedTo: taskAssignedTo.trim() || null,
          clientId: campaign?.clientId || null,
          dueDate: taskDueDate || null,
          prCampaignId: campaignId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create task");
      }

      setIsAddTaskOpen(false);
      setTaskTitle("");
      setTaskDesc("");
      setTaskPriority("NORMAL");
      setTaskStatus("TODO");
      setTaskAssignedTo("");
      setTaskDueDate("");
      fetchCampaignDetail();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchCampaignDetail();
    } catch (err) {
      console.error("Failed to update task status", err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) fetchCampaignDetail();
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const getStatusBadge = (status: string) => {
    let bg = "#F1F5F9";
    let color = "#64748B";
    const s = status.toUpperCase();

    if (s === "ACTIVE") { bg = "#EFF6FF"; color = "#2563EB"; }
    else if (s === "COMPLETED") { bg = "#F0FDF4"; color = "#16A34A"; }
    else if (s === "PAUSED") { bg = "#FFF7ED"; color = "#EA580C"; }
    else if (s === "PLANNING") { bg = "#F5F3FF"; color = "#7C3AED"; }
    else if (s === "CANCELLED") { bg = "#FEF2F2"; color = "#EF4444"; }

    return (
      <span style={{ background: bg, color, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    let bg = "#F1F5F9";
    let color = "#64748B";
    const p = priority.toUpperCase();

    if (p === "HIGH") { bg = "#FFF7ED"; color = "#EA580C"; }
    else if (p === "URGENT") { bg = "#FEF2F2"; color = "#EF4444"; }
    else if (p === "LOW") { bg = "#F0FDF4"; color = "#16A34A"; }

    return (
      <span style={{ background: bg, color, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", textTransform: "capitalize" }}>
        {priority.toLowerCase()}
      </span>
    );
  };

  const getFollowUpTag = (followUpDateStr: string | null, status: string) => {
    if (!followUpDateStr || ["PUBLISHED", "REJECTED", "LOST"].includes(status.toUpperCase())) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fud = new Date(followUpDateStr);
    fud.setHours(0, 0, 0, 0);

    if (fud.getTime() < today.getTime()) {
      return <span style={{ background: "#FEF2F2", color: "#EF4444", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>⚠ Overdue</span>;
    } else if (fud.getTime() === today.getTime()) {
      return <span style={{ background: "#FFF7ED", color: "#EA580C", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>★ Today</span>;
    } else {
      return <span style={{ background: "#F0FDF4", color: "#16A34A", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>Upcoming</span>;
    }
  };

  const calculateCampaignMetrics = () => {
    if (!campaign) return null;
    const total = campaign.outreachRecords.length;
    const contacted = campaign.outreachRecords.filter(o => o.outreachStatus !== "NOT_CONTACTED").length;
    const responses = campaign.outreachRecords.filter(o => ["RESPONDED", "INTERESTED", "PUBLISHED", "REJECTED"].includes(o.outreachStatus)).length;
    const placements = campaign.placements.length;
    const responseRate = contacted > 0 ? (responses / contacted) * 100 : 0;
    const placementRate = contacted > 0 ? (placements / contacted) * 100 : 0;
    
    return { total, contacted, responses, placements, responseRate, placementRate };
  };

  const metrics = calculateCampaignMetrics();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className={styles.container} style={{ padding: "40px", textAlign: "center" }}>
        <ShieldAlert size={48} color="#EF4444" />
        <h2>Campaign Not Found</h2>
        <Link href="/admin/pr" className={styles.btnSecondary} style={{ marginTop: "16px", display: "inline-block" }}>
          Back to PR Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ padding: "32px", maxWidth: "1500px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      
      {/* Breadcrumb Back */}
      <Link href="/admin/pr" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#64748B", fontSize: "13px", fontWeight: "500", marginBottom: "16px" }}>
        <ArrowLeft size={14} />
        Back to PR Dashboard
      </Link>

      {/* Campaign Details Header */}
      <div style={{ background: "white", padding: "24px 32px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8" }}>CAMPAIGN WORKSPACE</span>
            {getStatusBadge(campaign.status)}
            {getPriorityBadge(campaign.priority)}
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", margin: "8px 0 4px 0" }}>{campaign.campaignName}</h1>
          <span style={{ fontSize: "13px", color: "#64748B" }}>Client Association: <strong>{campaign.client?.name}</strong></span>
        </div>
        <button 
          onClick={() => setIsEditCampaignOpen(true)}
          style={{ padding: "8px 16px", background: "white", color: "#475569", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Edit3 size={14} />
          Edit Campaign
        </button>
      </div>

      {/* Tabs list */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E2E8F0", marginBottom: "24px" }}>
        {["overview", "outreach", "placements", "tasks", "activity"].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ padding: "10px 20px", background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #0D9488" : "2px solid transparent", color: activeTab === tab ? "#0D9488" : "#64748B", fontWeight: "600", fontSize: "13px", cursor: "pointer", textTransform: "capitalize", paddingBottom: "12px" }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div className={styles.tabContent}>
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <div style={{ flex: 2, background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#0F172A", fontWeight: "600" }}>Objective</h3>
                <p style={{ margin: 0, color: "#475569", fontSize: "14px", lineHeight: 1.5 }}>{campaign.objective || "No campaign objective declared."}</p>
              </div>
              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "16px" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#0F172A", fontWeight: "600" }}>Description & Pitch Angles</h3>
                <p style={{ margin: 0, color: "#475569", fontSize: "14px", lineHeight: 1.5, whiteSpace: "pre-line" }}>{campaign.description || "No description provided."}</p>
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px", minWidth: "300px" }}>
              <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#0F172A", fontWeight: "600", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>Campaign Summary</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Start Date</span><span style={{ fontWeight: "600" }}>{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "Not Set"}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Target End</span><span style={{ fontWeight: "600" }}>{campaign.targetDate ? new Date(campaign.targetDate).toLocaleDateString() : "Not Set"}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Budget (USD)</span><span style={{ fontWeight: "600", color: "#0D9488" }}>{campaign.budget ? `$${campaign.budget.toLocaleString()}` : "Not Set"}</span></div>
                </div>
              </div>

              {metrics && (
                <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#0F172A", fontWeight: "600", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>Campaign Stats</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Total Outreach Targets</span><span style={{ fontWeight: "600" }}>{metrics.total}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Pitches Sent</span><span style={{ fontWeight: "600" }}>{metrics.contacted}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Responses</span><span style={{ fontWeight: "600" }}>{metrics.responses}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Published Coverage</span><span style={{ fontWeight: "600", color: "#0D9488" }}>{metrics.placements}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Response Rate</span><span style={{ fontWeight: "600" }}>{metrics.responseRate.toFixed(1)}%</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Placement Rate</span><span style={{ fontWeight: "600" }}>{metrics.placementRate.toFixed(1)}%</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OUTREACH TAB */}
        {activeTab === "outreach" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Outreach Media List ({campaign.outreachRecords.length})</span>
              <button 
                onClick={() => setIsAddOutreachOpen(true)}
                style={{ padding: "6px 12px", background: "#0D9488", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Plus size={12} />
                Add Outreach Target
              </button>
            </div>

            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Media Outlet</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Contact Person</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Status</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Follow-up Date</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Notes</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.outreachRecords.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#94A3B8" }}>No outreach records added. Click "Add Outreach Target" to log journalists.</td></tr>
                  ) : (
                    campaign.outreachRecords.map((o) => (
                      <tr key={o.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "16px 24px", fontWeight: "600", color: "#0F172A" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Globe size={13} style={{ color: "#94A3B8" }} />
                            {o.publicationName}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px", color: "#475569" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <strong>{o.contactName}</strong>
                            <span style={{ color: "#94A3B8", fontSize: "11px" }}>{o.contactEmail || "No Email"}</span>
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <select 
                            value={o.outreachStatus} 
                            onChange={e => handleQuickOutreachStatus(o.id, e.target.value)}
                            style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: "4px", fontSize: "12px", background: "white" }}
                          >
                            <option value="NOT_CONTACTED">Not Contacted</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="FOLLOW_UP">Follow Up Scheduled</option>
                            <option value="RESPONDED">Responded</option>
                            <option value="INTERESTED">Interested</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="LOST">Lost</option>
                          </select>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: "#475569" }}>{o.followUpDate ? new Date(o.followUpDate).toLocaleDateString() : "—"}</span>
                            {getFollowUpTag(o.followUpDate, o.outreachStatus)}
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", color: "#64748B", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.notes || "—"}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <button 
                            onClick={() => handleDeleteOutreach(o.id)}
                            style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PLACEMENTS TAB */}
        {activeTab === "placements" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Published Placements ({campaign.placements.length})</span>
              <button 
                onClick={() => setIsAddPlacementOpen(true)}
                style={{ padding: "6px 12px", background: "#0D9488", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Plus size={12} />
                Add Placement Record
              </button>
            </div>

            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Article Title</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Publication</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Link Type</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Published Date</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Verification</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.placements.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#94A3B8" }}>No placements published yet. Click "Add Placement" to record press hits.</td></tr>
                  ) : (
                    campaign.placements.map((p) => (
                      <tr key={p.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "16px 24px", maxWidth: "300px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <strong style={{ color: "#0F172A" }}>{p.articleTitle}</strong>
                            <a href={p.articleUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0D9488", textDecoration: "none", fontSize: "11px", display: "flex", alignItems: "center", gap: "2px" }}>
                              View Article
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", color: "#475569" }}>{p.publicationName}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "700" }}>
                            {p.linkType}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px", color: "#64748B" }}>
                          {p.publishedDate ? new Date(p.publishedDate).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          {p.verifiedAt ? (
                            <span style={{ color: "#16A34A", fontWeight: "600", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                              <CheckCircle size={14} />
                              Verified
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleVerifyPlacement(p.id, true)}
                              style={{ padding: "4px 8px", background: "white", border: "1px solid #E2E8F0", borderRadius: "4px", fontSize: "11px", cursor: "pointer", color: "#475569" }}
                            >
                              Verify link
                            </button>
                          )}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <button 
                            onClick={() => handleDeletePlacement(p.id)}
                            style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === "tasks" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Campaign Action items ({campaign.tasks.length})</span>
              <button 
                onClick={() => setIsAddTaskOpen(true)}
                style={{ padding: "6px 12px", background: "#0D9488", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Plus size={12} />
                Add Action Task
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {campaign.tasks.length === 0 ? (
                <div style={{ background: "white", border: "1px solid #E2E8F0", padding: "24px", textAlign: "center", borderRadius: "8px", color: "#94A3B8" }}>
                  No tasks linked to this PR Campaign. Click "Add Action Task" to schedule pitches or briefs.
                </div>
              ) : (
                campaign.tasks.map((task) => (
                  <div key={task.id} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8" }}>#{task.id}</span>
                        <strong style={{ color: "#0F172A", textDecoration: task.status === "DONE" ? "line-through" : "none", opacity: task.status === "DONE" ? 0.6 : 1 }}>{task.title}</strong>
                        <span style={{ background: task.priority === "HIGH" ? "#FFF7ED" : "#F1F5F9", color: task.priority === "HIGH" ? "#EA580C" : "#64748B", padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "600" }}>{task.priority}</span>
                      </div>
                      {task.description && <p style={{ fontSize: "12px", color: "#475569", margin: "4px 0" }}>{task.description}</p>}
                      <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "#94A3B8" }}>
                        <span>Agent: {task.assignedTo || "—"}</span>
                        {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {task.status !== "DONE" && (
                        <button 
                          onClick={() => handleQuickTaskStatus(task.id, "DONE")}
                          style={{ padding: "4px 10px", background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                        >
                          Complete
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === "activity" && (
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#0F172A", fontWeight: "600", borderBottom: "1px solid #F1F5F9", paddingBottom: "10px" }}>Campaign Activity Timeline</h3>
            {campaign.activityLogs.length === 0 ? (
              <p style={{ color: "#94A3B8", fontSize: "13px" }}>No recent activity logs recorded for this campaign.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {campaign.activityLogs.map((log) => {
                  const meta = log.metadata ? JSON.parse(log.metadata) : {};
                  let text = log.action.replace(/_/g, " ").toLowerCase();
                  if (log.action === "PR_OUTREACH_STATUS_CHANGED") {
                    text = `outreach status for ${meta.publicationName || "target"} shifted from ${meta.oldStatus || "None"} to ${meta.newStatus || "None"}`;
                  } else if (log.action === "PR_PLACEMENT_ADDED") {
                    text = `placement published on ${meta.publicationName || "outlet"} added`;
                  } else if (log.action === "PR_OUTREACH_ADDED") {
                    text = `outreach target ${meta.publicationName || "outlet"} created`;
                  }

                  return (
                    <div key={log.id} style={{ display: "flex", gap: "12px", fontSize: "12px", borderBottom: "1px solid #F8FAFC", paddingBottom: "8px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0D9488", marginTop: "6px" }} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#0F172A", textTransform: "capitalize" }}><strong>{text}</strong></span>
                        <span style={{ color: "#94A3B8", fontSize: "10px" }}>By {log.actorEmail} on {new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Edit Campaign Modal */}
      {isEditCampaignOpen && (
        <div className={modalStyles.overlay} onClick={() => setIsEditCampaignOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>Edit PR Campaign Details</span>
              <button onClick={() => setIsEditCampaignOpen(false)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateCampaign} className={modalStyles.body}>
              {errorMsg && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", padding: "12px", borderRadius: "6px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem" }}>
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Campaign Name</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Objective / Target Goals</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={editObjective}
                  onChange={(e) => setEditObjective(e.target.value)}
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Description</label>
                <textarea
                  className={modalStyles.input}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  style={{ minHeight: "60px", resize: "vertical", padding: "8px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Status</label>
                  <select
                    className={modalStyles.input}
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Priority</label>
                  <select
                    className={modalStyles.input}
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Start Date</label>
                  <input
                    type="date"
                    className={modalStyles.input}
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Budget (USD)</label>
                  <input
                    type="number"
                    className={modalStyles.input}
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                  />
                </div>
              </div>
            </form>
            <div className={modalStyles.footer} style={{ display: "flex", justifyContent: "space-between" }}>
              <button 
                onClick={handleDeleteCampaign} 
                className={modalStyles.btn} 
                style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", cursor: "pointer" }}
                disabled={isSaving}
              >
                Delete Campaign
              </button>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setIsEditCampaignOpen(false)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`} disabled={isSaving}>
                  Cancel
                </button>
                <button onClick={handleUpdateCampaign} className={`${modalStyles.btn} ${modalStyles.btnSave}`} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Outreach Modal */}
      {isAddOutreachOpen && (
        <div className={modalStyles.overlay} onClick={() => setIsAddOutreachOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>Add Journalist Outreach Target</span>
              <button onClick={() => setIsAddOutreachOpen(false)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddOutreach} className={modalStyles.body}>
              {errorMsg && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", padding: "12px", borderRadius: "6px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem" }}>
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Media Outlet / Publication Name</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={outPubName}
                  onChange={(e) => setOutPubName(e.target.value)}
                  placeholder="e.g. Forbes, TechCrunch"
                  required
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Journalist / Contact Name</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={outContactName}
                  onChange={(e) => setOutContactName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  required
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Contact Email</label>
                <input
                  type="email"
                  className={modalStyles.input}
                  value={outContactEmail}
                  onChange={(e) => setOutContactEmail(e.target.value)}
                  placeholder="e.g. jane.smith@forbes.com"
                />
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Outreach Status</label>
                  <select
                    className={modalStyles.input}
                    value={outStatus}
                    onChange={(e) => setOutStatus(e.target.value)}
                  >
                    <option value="NOT_CONTACTED">Not Contacted</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="FOLLOW_UP">Follow Up Scheduled</option>
                    <option value="RESPONDED">Responded</option>
                    <option value="INTERESTED">Interested</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Follow Up Date</label>
                  <input
                    type="date"
                    className={modalStyles.input}
                    value={outFollowUpDate}
                    onChange={(e) => setOutFollowUpDate(e.target.value)}
                  />
                </div>
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Target Pitch Link / Objective URL</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={outTargetUrl}
                  onChange={(e) => setOutTargetUrl(e.target.value)}
                  placeholder="e.g. https://client.com/features/product"
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Outreach Notes</label>
                <textarea
                  className={modalStyles.input}
                  value={outNotes}
                  onChange={(e) => setOutNotes(e.target.value)}
                  placeholder="Pitch details, journalist preferences..."
                  style={{ minHeight: "50px", resize: "vertical", padding: "8px" }}
                />
              </div>
            </form>
            <div className={modalStyles.footer} style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setIsAddOutreachOpen(false)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`} disabled={isSaving}>
                Cancel
              </button>
              <button onClick={handleAddOutreach} className={`${modalStyles.btn} ${modalStyles.btnSave}`} disabled={isSaving}>
                {isSaving ? "Saving..." : "Add Target"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Placement Modal */}
      {isAddPlacementOpen && (
        <div className={modalStyles.overlay} onClick={() => setIsAddPlacementOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>Record Press Placement / Coverage</span>
              <button onClick={() => setIsAddPlacementOpen(false)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddPlacement} className={modalStyles.body}>
              {errorMsg && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", padding: "12px", borderRadius: "6px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem" }}>
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Article Title</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={placeTitle}
                  onChange={(e) => setPlaceTitle(e.target.value)}
                  placeholder="e.g. How Fintech is Re-shaping Finance in 2026"
                  required
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Article URL</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={placeUrl}
                  onChange={(e) => setPlaceUrl(e.target.value)}
                  placeholder="e.g. https://techcrunch.com/2026/08/fintech-reshape"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Publication Name</label>
                  <input
                    type="text"
                    className={modalStyles.input}
                    value={placePubName}
                    onChange={(e) => setPlacePubName(e.target.value)}
                    placeholder="e.g. TechCrunch"
                    required
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Publication Domain/Website URL</label>
                  <input
                    type="text"
                    className={modalStyles.input}
                    value={placePubUrl}
                    onChange={(e) => setPlacePubUrl(e.target.value)}
                    placeholder="e.g. https://techcrunch.com"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Link Type</label>
                  <select
                    className={modalStyles.input}
                    value={placeLinkType}
                    onChange={(e) => setPlaceLinkType(e.target.value)}
                  >
                    <option value="FOLLOW">Follow Link</option>
                    <option value="NOFOLLOW">Nofollow Link</option>
                    <option value="MENTION_ONLY">Mention Only (No backlink)</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Published Date</label>
                  <input
                    type="date"
                    className={modalStyles.input}
                    value={placePubDate}
                    onChange={(e) => setPlacePubDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Target Client URL</label>
                  <input
                    type="text"
                    className={modalStyles.input}
                    value={placeTargetUrl}
                    onChange={(e) => setPlaceTargetUrl(e.target.value)}
                    placeholder="e.g. https://client.com/features"
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Linked Outreach Target (Optional)</label>
                  <select
                    className={modalStyles.input}
                    value={placeOutreachId}
                    onChange={(e) => setPlaceOutreachId(e.target.value)}
                  >
                    <option value="">-- Unlinked --</option>
                    {campaign.outreachRecords.map((o) => (
                      <option key={o.id} value={o.id}>{o.publicationName} - {o.contactName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Placement Notes</label>
                <textarea
                  className={modalStyles.input}
                  value={placeNotes}
                  onChange={(e) => setPlaceNotes(e.target.value)}
                  placeholder="Add details, link anchors, views metrics..."
                  style={{ minHeight: "50px", resize: "vertical", padding: "8px" }}
                />
              </div>
            </form>
            <div className={modalStyles.footer} style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setIsAddPlacementOpen(false)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`} disabled={isSaving}>
                Cancel
              </button>
              <button onClick={handleAddPlacement} className={`${modalStyles.btn} ${modalStyles.btnSave}`} disabled={isSaving}>
                {isSaving ? "Saving..." : "Add Placement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isAddTaskOpen && (
        <div className={modalStyles.overlay} onClick={() => setIsAddTaskOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>Create Campaign Action Item</span>
              <button onClick={() => setIsAddTaskOpen(false)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddTask} className={modalStyles.body}>
              {errorMsg && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", padding: "12px", borderRadius: "6px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem" }}>
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Task Title</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Write press release draft"
                  required
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Description</label>
                <textarea
                  className={modalStyles.input}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Details on requirements..."
                  style={{ minHeight: "50px", resize: "vertical", padding: "8px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Priority</label>
                  <select
                    className={modalStyles.input}
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Due Date</label>
                  <input
                    type="date"
                    className={modalStyles.input}
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Assigned Agent</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={taskAssignedTo}
                  onChange={(e) => setTaskAssignedTo(e.target.value)}
                  placeholder="e.g. Sarah J."
                />
              </div>
            </form>
            <div className={modalStyles.footer} style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setIsAddTaskOpen(false)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`} disabled={isSaving}>
                Cancel
              </button>
              <button onClick={handleAddTask} className={`${modalStyles.btn} ${modalStyles.btnSave}`} disabled={isSaving}>
                {isSaving ? "Saving..." : "Add Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
