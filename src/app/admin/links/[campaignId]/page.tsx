"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Plus, X, AlertCircle, Trash2, Calendar, CheckCircle, ExternalLink, Globe, User, ShieldAlert, Award, RefreshCw, BarChart2 } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";
import modalStyles from "@/styles/ClientModal.module.css";

interface Opportunity {
  id: number;
  domain: string;
  websiteName: string;
  websiteUrl: string;
  contactName: string | null;
  contactEmail: string | null;
  sourceType: string;
  relevance: string | null;
  authorityMetric: number | null;
  authoritySource: string;
  targetPage: string | null;
  proposedAnchorText: string | null;
  status: string;
  notes: string | null;
  followUpDate: string | null;
}

interface Backlink {
  id: number;
  sourceDomain: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  linkType: string;
  status: string;
  acquiredDate: string;
  firstVerifiedAt: string | null;
  lastCheckedAt: string | null;
  notes: string | null;
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
  name: string;
  clientId: number;
  client: { name: string };
  description: string | null;
  objective: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  targetDate: string | null;
  completedDate: string | null;
  monthlyTarget: number | null;
  opportunities: Opportunity[];
  acquiredLinks: Backlink[];
  tasks: Task[];
  activityLogs: ActivityLog[];
}

export default function LinkCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = parseInt(params.campaignId as string, 10);

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, opportunities, backlinks, tasks, activity
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  // Modals state
  const [isEditCampaignOpen, setIsEditCampaignOpen] = useState(false);
  const [isAddOpportunityOpen, setIsAddOpportunityOpen] = useState(false);
  const [isAddBacklinkOpen, setIsAddBacklinkOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Edit Campaign fields
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editObjective, setEditObjective] = useState("");
  const [editStatus, setEditStatus] = useState("DRAFT");
  const [editPriority, setEditPriority] = useState("NORMAL");
  const [editStartDate, setEditStartDate] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editMonthlyTarget, setEditMonthlyTarget] = useState("");

  // Opportunity fields
  const [oppDomain, setOppDomain] = useState("");
  const [oppWebName, setOppWebName] = useState("");
  const [oppWebUrl, setOppWebUrl] = useState("");
  const [oppContactName, setOppContactName] = useState("");
  const [oppContactEmail, setOppContactEmail] = useState("");
  const [oppSourceType, setOppSourceType] = useState("MANUAL");
  const [oppRelevance, setOppRelevance] = useState("Medium");
  const [oppAuthority, setOppAuthority] = useState("");
  const [oppTargetPage, setOppTargetPage] = useState("");
  const [oppAnchor, setOppAnchor] = useState("");
  const [oppStatus, setOppStatus] = useState("PROSPECT");
  const [oppFollowUp, setOppFollowUp] = useState("");
  const [oppNotes, setOppNotes] = useState("");

  // Backlink fields
  const [backDomain, setBackDomain] = useState("");
  const [backUrl, setBackUrl] = useState("");
  const [backTargetUrl, setBackTargetUrl] = useState("");
  const [backAnchor, setBackAnchor] = useState("");
  const [backType, setBackType] = useState("FOLLOW");
  const [backAcquiredDate, setBackAcquiredDate] = useState("");
  const [backNotes, setBackNotes] = useState("");
  const [backOppId, setBackOppId] = useState("");

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
      const res = await fetch(`/api/links/campaigns/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
        // Pre-fill edit fields
        setEditName(data.name);
        setEditDesc(data.description || "");
        setEditObjective(data.objective || "");
        setEditStatus(data.status);
        setEditPriority(data.priority);
        setEditStartDate(data.startDate ? new Date(data.startDate).toISOString().split("T")[0] : "");
        setEditTargetDate(data.targetDate ? new Date(data.targetDate).toISOString().split("T")[0] : "");
        setEditMonthlyTarget(data.monthlyTarget?.toString() || "");
      } else {
        router.push("/admin/links");
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
      const res = await fetch(`/api/links/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          objective: editObjective,
          status: editStatus,
          priority: editPriority,
          startDate: editStartDate || null,
          targetDate: editTargetDate || null,
          monthlyTarget: editMonthlyTarget ? parseInt(editMonthlyTarget, 10) : null,
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
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this Link Building campaign?");
    if (!confirmDelete) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/links/campaigns/${campaignId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete campaign");
      router.push("/admin/links");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oppDomain.trim() || !oppWebName.trim() || !oppWebUrl.trim()) {
      setErrorMsg("Domain, Website Name, and Website URL are required.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/links/campaigns/${campaignId}/opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: oppDomain,
          websiteName: oppWebName,
          websiteUrl: oppWebUrl,
          contactName: oppContactName || null,
          contactEmail: oppContactEmail || null,
          sourceType: oppSourceType,
          relevance: oppRelevance,
          authorityMetric: oppAuthority ? parseInt(oppAuthority, 10) : null,
          targetPage: oppTargetPage || null,
          proposedAnchorText: oppAnchor || null,
          status: oppStatus,
          followUpDate: oppFollowUp || null,
          notes: oppNotes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add opportunity");
      }

      setIsAddOpportunityOpen(false);
      setOppDomain("");
      setOppWebName("");
      setOppWebUrl("");
      setOppContactName("");
      setOppContactEmail("");
      setOppSourceType("MANUAL");
      setOppAuthority("");
      setOppTargetPage("");
      setOppAnchor("");
      setOppStatus("PROSPECT");
      setOppFollowUp("");
      setOppNotes("");
      fetchCampaignDetail();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickOppStatus = async (recordId: number, status: string) => {
    try {
      const res = await fetch(`/api/links/opportunities/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchCampaignDetail();
    } catch (err) {
      console.error("Failed to update opportunity status", err);
    }
  };

  const handleDeleteOpportunity = async (recordId: number) => {
    const confirmDelete = window.confirm("Are you sure you want to remove this link prospect?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/links/opportunities/${recordId}`, { method: "DELETE" });
      if (res.ok) fetchCampaignDetail();
    } catch (err) {
      console.error("Failed to delete opportunity", err);
    }
  };

  const handleAddBacklink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backDomain.trim() || !backUrl.trim() || !backTargetUrl.trim() || !backAnchor.trim()) {
      setErrorMsg("Source Domain, Source URL, Target URL, and Anchor Text are required.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/links/campaigns/${campaignId}/backlinks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceDomain: backDomain,
          sourceUrl: backUrl,
          targetUrl: backTargetUrl,
          anchorText: backAnchor,
          linkType: backType,
          notes: backNotes || null,
          opportunityId: backOppId ? parseInt(backOppId, 10) : null,
          acquiredDate: backAcquiredDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add backlink");
      }

      setIsAddBacklinkOpen(false);
      setBackDomain("");
      setBackUrl("");
      setBackTargetUrl("");
      setBackAnchor("");
      setBackType("FOLLOW");
      setBackNotes("");
      setBackOppId("");
      setBackAcquiredDate("");
      fetchCampaignDetail();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyBacklink = async (backlinkId: number) => {
    setVerifyingId(backlinkId);
    try {
      const res = await fetch(`/api/links/backlinks/${backlinkId}/verify`, { method: "POST" });
      if (res.ok) {
        fetchCampaignDetail();
      }
    } catch (err) {
      console.error("Failed to verify backlink", err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteBacklink = async (backlinkId: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this backlink record?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/links/backlinks/${backlinkId}`, { method: "DELETE" });
      if (res.ok) fetchCampaignDetail();
    } catch (err) {
      console.error("Failed to delete backlink", err);
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
          linkCampaignId: campaignId,
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
    if (!followUpDateStr || ["REJECTED", "ACQUIRED", "LOST"].includes(status.toUpperCase())) return null;
    
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

  const getHealthBadge = (healthStatus: string) => {
    let bg = "#F1F5F9";
    let color = "#64748B";
    const h = healthStatus.toUpperCase();

    if (h === "LIVE") { bg = "#F0FDF4"; color = "#16A34A"; }
    else if (h === "PENDING_VERIFICATION") { bg = "#EFF6FF"; color = "#2563EB"; }
    else if (h === "MISSING" || h === "BROKEN") { bg = "#FEF2F2"; color = "#EF4444"; }
    else if (h === "REDIRECTED") { bg = "#FFF7ED"; color = "#EA580C"; }

    return (
      <span style={{ background: bg, color, padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", textTransform: "capitalize" }}>
        {healthStatus.replace(/_/g, " ").toLowerCase()}
      </span>
    );
  };

  const calculateCampaignMetrics = () => {
    if (!campaign) return null;
    const prospects = campaign.opportunities.length;
    const qualified = campaign.opportunities.filter(o => o.status === "QUALIFIED").length;
    const contacted = campaign.opportunities.filter(o => o.status !== "PROSPECT" && o.status !== "QUALIFIED").length;
    const acquired = campaign.acquiredLinks.length;
    const live = campaign.acquiredLinks.filter(l => l.status === "LIVE").length;
    
    const denom = qualified + contacted;
    const acquisitionRate = denom > 0 ? (acquired / denom) * 100 : 0;
    
    return { prospects, qualified, contacted, acquired, live, acquisitionRate };
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
        <Link href="/admin/links" className={styles.btnSecondary} style={{ marginTop: "16px", display: "inline-block" }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ padding: "32px", maxWidth: "1500px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      
      {/* Breadcrumb Back */}
      <Link href="/admin/links" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#64748B", fontSize: "13px", fontWeight: "500", marginBottom: "16px" }}>
        <ArrowLeft size={14} />
        Back to Links Dashboard
      </Link>

      {/* Campaign Details Header */}
      <div style={{ background: "white", padding: "24px 32px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8" }}>LINK BUILDING WORKSPACE</span>
            {getStatusBadge(campaign.status)}
            {getPriorityBadge(campaign.priority)}
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", margin: "8px 0 4px 0" }}>{campaign.name}</h1>
          <span style={{ fontSize: "13px", color: "#64748B" }}>Client: <strong>{campaign.client?.name}</strong></span>
        </div>
        <button 
          onClick={() => setIsEditCampaignOpen(true)}
          style={{ padding: "8px 16px", background: "white", color: "#475569", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Edit3 size={14} />
          Edit Campaign
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E2E8F0", marginBottom: "24px" }}>
        {["overview", "opportunities", "backlinks", "tasks", "activity"].map(tab => (
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
                <p style={{ margin: 0, color: "#475569", fontSize: "14px", lineHeight: 1.5 }}>{campaign.objective || "No objective registered for this campaign."}</p>
              </div>
              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "16px" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#0F172A", fontWeight: "600" }}>Campaign Parameters</h3>
                <p style={{ margin: 0, color: "#475569", fontSize: "14px", lineHeight: 1.5, whiteSpace: "pre-line" }}>{campaign.description || "No description provided."}</p>
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px", minWidth: "300px" }}>
              <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#0F172A", fontWeight: "600", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>Campaign Timeline</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Start Date</span><span style={{ fontWeight: "600" }}>{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "Not Set"}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Target Date</span><span style={{ fontWeight: "600" }}>{campaign.targetDate ? new Date(campaign.targetDate).toLocaleDateString() : "Not Set"}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Monthly Backlinks Goal</span><span style={{ fontWeight: "600" }}>{campaign.monthlyTarget || "Not Set"}</span></div>
                </div>
              </div>

              {metrics && (
                <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#0F172A", fontWeight: "600", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>Pipeline Metrics</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Total Prospects</span><span style={{ fontWeight: "600" }}>{metrics.prospects}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Qualified Targets</span><span style={{ fontWeight: "600" }}>{metrics.qualified}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Contacted Outlets</span><span style={{ fontWeight: "600" }}>{metrics.contacted}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Acquired Backlinks</span><span style={{ fontWeight: "600", color: "#0D9488" }}>{metrics.acquired}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Live Backlinks</span><span style={{ fontWeight: "600", color: "#16A34A" }}>{metrics.live}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Conversion Rate</span><span style={{ fontWeight: "600" }}>{metrics.acquisitionRate.toFixed(1)}%</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OPPORTUNITIES TAB */}
        {activeTab === "opportunities" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Domain Targets & Prospects ({campaign.opportunities.length})</span>
              <button 
                onClick={() => setIsAddOpportunityOpen(true)}
                style={{ padding: "6px 12px", background: "#0D9488", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Plus size={12} />
                Add Prospect Domain
              </button>
            </div>

            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Prospect Domain</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Authority (DA/DR)</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Source Type</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Outreach Status</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Follow-up Date</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.opportunities.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#94A3B8" }}>No prospects registered. Click "Add Prospect Domain" to populate list.</td></tr>
                  ) : (
                    campaign.opportunities.map((opp) => (
                      <tr key={opp.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <strong style={{ color: "#0F172A" }}>{opp.websiteName}</strong>
                            <a href={opp.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#94A3B8", textDecoration: "none", fontSize: "11px" }}>{opp.domain}</a>
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", color: "#475569" }}>
                          {opp.authorityMetric ? (
                            <span>{opp.authorityMetric} <span style={{ color: "#94A3B8", fontSize: "11px" }}>({opp.authoritySource.toLowerCase()})</span></span>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "16px 24px", color: "#64748B", textTransform: "capitalize" }}>
                          {opp.sourceType.replace(/_/g, " ").toLowerCase()}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <select 
                            value={opp.status} 
                            onChange={e => handleQuickOppStatus(opp.id, e.target.value)}
                            style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: "4px", fontSize: "12px", background: "white" }}
                          >
                            <option value="PROSPECT">Prospect</option>
                            <option value="QUALIFIED">Qualified</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="FOLLOW_UP">Follow Up Scheduled</option>
                            <option value="NEGOTIATING">Negotiating</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="ACQUIRED">Acquired</option>
                            <option value="LOST">Lost</option>
                          </select>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>{opp.followUpDate ? new Date(opp.followUpDate).toLocaleDateString() : "—"}</span>
                            {getFollowUpTag(opp.followUpDate, opp.status)}
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <button 
                            onClick={() => handleDeleteOpportunity(opp.id)}
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

        {/* BACKLINKS TAB */}
        {activeTab === "backlinks" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Acquired Backlink Ledger ({campaign.acquiredLinks.length})</span>
              <button 
                onClick={() => setIsAddBacklinkOpen(true)}
                style={{ padding: "6px 12px", background: "#0D9488", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Plus size={12} />
                Add Acquired Link
              </button>
            </div>

            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Source Backlink URL</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Target URL & Anchor</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Link Type</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Verification</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Last Checked</th>
                    <th style={{ padding: "12px 24px", fontWeight: "600" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.acquiredLinks.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#94A3B8" }}>No acquired links recorded. Click "Add Acquired Link" to register backlink details.</td></tr>
                  ) : (
                    campaign.acquiredLinks.map((back) => (
                      <tr key={back.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "16px 24px", maxWidth: "250px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <strong style={{ color: "#0F172A" }}>{back.sourceDomain}</strong>
                            <a href={back.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0D9488", textDecoration: "none", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                              Source Page
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", maxWidth: "250px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>Anchor: <strong>"{back.anchorText}"</strong></span>
                            <span style={{ fontSize: "11px", color: "#94A3B8" }}>Target: {back.targetUrl}</span>
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "700" }}>
                            {back.linkType}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {getHealthBadge(back.status)}
                            <button 
                              onClick={() => handleVerifyBacklink(back.id)}
                              className={styles.btnSecondary}
                              style={{ padding: "4px 8px", fontSize: "11px", display: "inline-flex", gap: "4px", cursor: "pointer", alignItems: "center" }}
                              disabled={verifyingId === back.id}
                            >
                              <RefreshCw size={11} className={verifyingId === back.id ? "spin" : ""} />
                              {verifyingId === back.id ? "Checking..." : "Verify Link"}
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", color: "#64748B" }}>
                          {back.lastCheckedAt ? new Date(back.lastCheckedAt).toLocaleString() : "Never checked"}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <button 
                            onClick={() => handleDeleteBacklink(back.id)}
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
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Campaign Actions & Tasks ({campaign.tasks.length})</span>
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
                  No administrative tasks linked to this Campaign. Click "Add Action Task" to add action items.
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
                        <span>Assignee: {task.assignedTo || "—"}</span>
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
            <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#0F172A", fontWeight: "600", borderBottom: "1px solid #F1F5F9", paddingBottom: "10px" }}>Campaign Action History</h3>
            {campaign.activityLogs.length === 0 ? (
              <p style={{ color: "#94A3B8", fontSize: "13px" }}>No activity logs recorded for this campaign.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {campaign.activityLogs.map((log) => {
                  const meta = log.metadata ? JSON.parse(log.metadata) : {};
                  let text = log.action.replace(/_/g, " ").toLowerCase();
                  if (log.action === "LINK_OPPORTUNITY_STATUS_CHANGED") {
                    text = `prospect status for ${meta.websiteName || "domain"} updated from ${meta.oldStatus || "None"} to ${meta.newStatus || "None"}`;
                  } else if (log.action === "LINK_OPPORTUNITY_CREATED") {
                    text = `prospect domain ${meta.websiteName || "website"} added to outreach list`;
                  } else if (log.action === "LINK_BACKLINK_CREATED") {
                    text = `acquired backlink on ${meta.sourceDomain || "source"} recorded`;
                  } else if (log.action === "LINK_BACKLINK_VERIFIED") {
                    text = `acquired backlink on ${meta.sourceDomain || "source"} successfully verified LIVE`;
                  } else if (log.action === "LINK_BACKLINK_VERIFICATION_FAILED") {
                    text = `backlink verification on ${meta.sourceDomain || "source"} failed: ${meta.status || "UNKNOWN"} (${meta.error || "No matching links"})`;
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
              <span className={modalStyles.title}>Edit Link Campaign</span>
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
                  <label className={modalStyles.label}>Monthly Backlinks Target</label>
                  <input
                    type="number"
                    className={modalStyles.input}
                    value={editMonthlyTarget}
                    onChange={(e) => setEditMonthlyTarget(e.target.value)}
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

      {/* Add Opportunity Modal */}
      {isAddOpportunityOpen && (
        <div className={modalStyles.overlay} onClick={() => setIsAddOpportunityOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>Add Prospect / Opportunity Target</span>
              <button onClick={() => setIsAddOpportunityOpen(false)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddOpportunity} className={modalStyles.body}>
              {errorMsg && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", padding: "12px", borderRadius: "6px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem" }}>
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Website Name</label>
                  <input
                    type="text"
                    className={modalStyles.input}
                    value={oppWebName}
                    onChange={(e) => setOppWebName(e.target.value)}
                    placeholder="e.g. Forbes Blog"
                    required
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Domain Name</label>
                  <input
                    type="text"
                    className={modalStyles.input}
                    value={oppDomain}
                    onChange={(e) => setOppDomain(e.target.value)}
                    placeholder="e.g. forbes.com"
                    required
                  />
                </div>
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Website URL</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={oppWebUrl}
                  onChange={(e) => setOppWebUrl(e.target.value)}
                  placeholder="e.g. https://www.forbes.com"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Contact Name</label>
                  <input
                    type="text"
                    className={modalStyles.input}
                    value={oppContactName}
                    onChange={(e) => setOppContactName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Contact Email</label>
                  <input
                    type="email"
                    className={modalStyles.input}
                    value={oppContactEmail}
                    onChange={(e) => setOppContactEmail(e.target.value)}
                    placeholder="e.g. j.smith@forbes.com"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Source Type</label>
                  <select
                    className={modalStyles.input}
                    value={oppSourceType}
                    onChange={(e) => setOppSourceType(e.target.value)}
                  >
                    <option value="MANUAL">Manual</option>
                    <option value="GUEST_POST">Guest Post</option>
                    <option value="RESOURCE_PAGE">Resource Page</option>
                    <option value="BROKEN_LINK">Broken Link</option>
                    <option value="PARTNERSHIP">Partnership</option>
                    <option value="DIRECTORY">Directory</option>
                    <option value="COMPETITOR_RESEARCH">Competitor Research</option>
                  </select>
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Niche Relevance</label>
                  <select
                    className={modalStyles.input}
                    value={oppRelevance}
                    onChange={(e) => setOppRelevance(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Domain Authority (0-100)</label>
                  <input
                    type="number"
                    className={modalStyles.input}
                    value={oppAuthority}
                    onChange={(e) => setOppAuthority(e.target.value)}
                    placeholder="e.g. 84"
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Status</label>
                  <select
                    className={modalStyles.input}
                    value={oppStatus}
                    onChange={(e) => setOppStatus(e.target.value)}
                  >
                    <option value="PROSPECT">Prospect</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="FOLLOW_UP">Follow Up Scheduled</option>
                    <option value="NEGOTIATING">Negotiating</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Target Page (Client URL)</label>
                  <input
                    type="text"
                    className={modalStyles.input}
                    value={oppTargetPage}
                    onChange={(e) => setOppTargetPage(e.target.value)}
                    placeholder="e.g. https://client.com/features"
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Follow Up Date</label>
                  <input
                    type="date"
                    className={modalStyles.input}
                    value={oppFollowUp}
                    onChange={(e) => setOppFollowUp(e.target.value)}
                  />
                </div>
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Proposed Anchor Text</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={oppAnchor}
                  onChange={(e) => setOppAnchor(e.target.value)}
                  placeholder="e.g. modern financial tech"
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Outreach Notes</label>
                <textarea
                  className={modalStyles.input}
                  value={oppNotes}
                  onChange={(e) => setOppNotes(e.target.value)}
                  placeholder="History, editor name, emails reference..."
                  style={{ minHeight: "50px", resize: "vertical", padding: "8px" }}
                />
              </div>
            </form>
            <div className={modalStyles.footer} style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setIsAddOpportunityOpen(false)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`} disabled={isSaving}>
                Cancel
              </button>
              <button onClick={handleAddOpportunity} className={`${modalStyles.btn} ${modalStyles.btnSave}`} disabled={isSaving}>
                {isSaving ? "Saving..." : "Add Target"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Backlink Modal */}
      {isAddBacklinkOpen && (
        <div className={modalStyles.overlay} onClick={() => setIsAddBacklinkOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>Record Acquired Backlink</span>
              <button onClick={() => setIsAddBacklinkOpen(false)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddBacklink} className={modalStyles.body}>
              {errorMsg && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", padding: "12px", borderRadius: "6px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem" }}>
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Source URL</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={backUrl}
                  onChange={(e) => setBackUrl(e.target.value)}
                  placeholder="e.g. https://www.forbes.com/blog/2026/08/fintech-trends"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Source Domain</label>
                  <input
                    type="text"
                    className={modalStyles.input}
                    value={backDomain}
                    onChange={(e) => setBackDomain(e.target.value)}
                    placeholder="e.g. forbes.com"
                    required
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Target URL</label>
                  <input
                    type="text"
                    className={modalStyles.input}
                    value={backTargetUrl}
                    onChange={(e) => setBackTargetUrl(e.target.value)}
                    placeholder="e.g. https://client.com/financial-tool"
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Anchor Text</label>
                  <input
                    type="text"
                    className={modalStyles.input}
                    value={backAnchor}
                    onChange={(e) => setBackAnchor(e.target.value)}
                    placeholder="e.g. modern financial tech"
                    required
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Link Type</label>
                  <select
                    className={modalStyles.input}
                    value={backType}
                    onChange={(e) => setBackType(e.target.value)}
                  >
                    <option value="FOLLOW">Follow Link</option>
                    <option value="NOFOLLOW">Nofollow Link</option>
                    <option value="SPONSORED">Sponsored Link</option>
                    <option value="UGC">UGC Link</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Acquisition Date</label>
                  <input
                    type="date"
                    className={modalStyles.input}
                    value={backAcquiredDate}
                    onChange={(e) => setBackAcquiredDate(e.target.value)}
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Linked Prospect Opportunity (Optional)</label>
                  <select
                    className={modalStyles.input}
                    value={backOppId}
                    onChange={(e) => setBackOppId(e.target.value)}
                  >
                    <option value="">-- Unlinked --</option>
                    {campaign.opportunities.map(o => (
                      <option key={o.id} value={o.id}>{o.websiteName} ({o.domain})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Backlink Notes</label>
                <textarea
                  className={modalStyles.input}
                  value={backNotes}
                  onChange={(e) => setBackNotes(e.target.value)}
                  placeholder="Backlink parameters, verified index comments..."
                  style={{ minHeight: "50px", resize: "vertical", padding: "8px" }}
                />
              </div>
            </form>
            <div className={modalStyles.footer} style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setIsAddBacklinkOpen(false)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`} disabled={isSaving}>
                Cancel
              </button>
              <button onClick={handleAddBacklink} className={`${modalStyles.btn} ${modalStyles.btnSave}`} disabled={isSaving}>
                {isSaving ? "Saving..." : "Add Link"}
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
                  placeholder="e.g. Qualify Forbes prospects list"
                  required
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Description</label>
                <textarea
                  className={modalStyles.input}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Specific tasks details..."
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
