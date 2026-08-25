"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Filter, ClipboardList, Clock, CheckCircle, AlertCircle, X, Trash2, ArrowRight, Activity, Calendar } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";
import modalStyles from "@/styles/ClientModal.module.css";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  clientId: number | null;
  client: { name: string } | null;
  dueDate: string | null;
  updatedAt: string;
}

interface ActivityLog {
  id: number;
  actorEmail: string;
  action: string;
  clientId: number | null;
  clientName: string | null;
  metadata: string | null;
  createdAt: string;
}

export default function OpsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [clientsList, setClientsList] = useState<Array<{ id: number; name: string }>>([]);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStatus, setFormStatus] = useState("TODO");
  const [formPriority, setFormPriority] = useState("NORMAL");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search);
      
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/activity-logs?limit=15");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load activity logs", err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients?archived=ACTIVE_ONLY");
      if (res.ok) {
        const data = await res.json();
        setClientsList(data.clients || []);
      }
    } catch (err) {
      console.error("Failed to load clients list", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchLogs();
    fetchClients();
  }, [statusFilter, search]);

  const openCreateModal = () => {
    setModalMode("create");
    setActiveTask(null);
    setFormTitle("");
    setFormDesc("");
    setFormStatus("TODO");
    setFormPriority("NORMAL");
    setFormAssignedTo("");
    setFormClientId("");
    setFormDueDate("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setModalMode("edit");
    setActiveTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || "");
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setFormAssignedTo(task.assignedTo || "");
    setFormClientId(task.clientId?.toString() || "");
    setFormDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setErrorMsg("Task title is required.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        title: formTitle.trim(),
        description: formDesc.trim() || null,
        status: formStatus,
        priority: formPriority,
        assignedTo: formAssignedTo.trim() || null,
        clientId: formClientId ? parseInt(formClientId, 10) : null,
        dueDate: formDueDate || null,
      };

      const url = modalMode === "create" ? "/api/tasks" : `/api/tasks/${activeTask?.id}`;
      const method = modalMode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || "Failed to save task.");
      }

      setIsModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!activeTask) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${activeTask.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task.");
      setIsModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickStatusChange = async (task: Task, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    let bg = "#F1F5F9";
    let color = "#64748B";
    const p = priority.toUpperCase();
    
    if (p === "HIGH") { bg = "#FFF7ED"; color = "#EA580C"; }
    else if (p === "LOW") { bg = "#F0FDF4"; color = "#16A34A"; }
    else if (p === "URGENT") { bg = "#FEF2F2"; color = "#EF4444"; }
    
    return (
      <span style={{ background: bg, color, padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "600", textTransform: "capitalize" }}>
        {priority.toLowerCase()}
      </span>
    );
  };

  const getActivityLogMeta = (action: string, metaStr: string | null) => {
    const meta = metaStr ? JSON.parse(metaStr) : {};
    switch (action) {
      case "CLIENT_CREATED":
        return "Client account registered";
      case "WEBSITE_CHANGED":
        return "Website domain changed";
      case "INTEGRATION_CONNECTED":
        return `${meta.provider || "Service"} connected`;
      case "INTEGRATION_DISCONNECTED":
        return `${meta.provider || "Service"} disconnected`;
      case "CLIENT_UPDATED":
        return "Client details updated";
      case "CLIENT_ARCHIVED":
        return "Client archived";
      case "CLIENT_RESTORED":
        return "Client restored";
      default:
        return action.replace(/_/g, " ").toLowerCase();
    }
  };

  return (
    <div className={styles.container} style={{ padding: "32px", maxWidth: "1500px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 className={styles.title} style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>Operations & Tasks</h1>
          <p className={styles.subtitle} style={{ margin: "4px 0 0 0" }}>Manage internal agency operations, task lists, and audit updates.</p>
        </div>
        <button 
          onClick={openCreateModal}
          style={{ padding: "8px 16px", background: "#0D9488", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={14} />
          New Task
        </button>
      </div>

      {/* Two Column Workspace */}
      <div style={{ display: "flex", gap: "24px", marginTop: "24px" }}>
        {/* Left Column: Tasks Board (70%) */}
        <div style={{ flex: 7, display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Filters Area */}
          <div style={{ background: "white", padding: "16px 24px", borderRadius: "8px", border: "1px solid #E2E8F0", display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
              <Search size={16} style={{ color: "#94A3B8" }} />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", border: "none", outline: "none", fontSize: "13px" }}
              />
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderLeft: "1px solid #E2E8F0", paddingLeft: "16px" }}>
              <span style={{ fontSize: "13px", color: "#64748B" }}>Status:</span>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", background: "white" }}>
                <option value="All">All Tasks</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>

          {/* Tasks Grid Board */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px", background: "white", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
              <div className="spinner" />
            </div>
          ) : tasks.length === 0 ? (
            <div className={styles.emptyState} style={{ background: "white", padding: "60px", textAlign: "center" }}>
              <ClipboardList className={styles.emptyIcon} style={{ fontSize: "48px", color: "#94A3B8", marginBottom: "16px" }} />
              <h2 className={styles.emptyTitle} style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>No Tasks Registered</h2>
              <p className={styles.emptyDesc} style={{ color: "#64748B", margin: "8px 0 16px 0" }}>Create a new task to organize your operations queue.</p>
              <button onClick={openCreateModal} className={styles.btnPrimary} style={{ margin: "0 auto" }}>
                <Plus size={14} style={{ marginRight: "4px" }} />
                New Task
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "transform 0.2s, box-shadow 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgb(0 0 0 / 0.05)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", fontFamily: "var(--font-mono)" }}>#{task.id}</span>
                      <strong 
                        onClick={() => openEditModal(task)} 
                        style={{ cursor: "pointer", fontSize: "14px", color: "#0F172A", textDecoration: task.status === "DONE" ? "line-through" : "none", opacity: task.status === "DONE" ? 0.6 : 1 }}
                      >
                        {task.title}
                      </strong>
                      {getPriorityBadge(task.priority)}
                    </div>
                    {task.description && (
                      <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569", lineHeight: 1.4, maxWidth: "600px" }}>{task.description}</p>
                    )}
                    <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                      {task.client && (
                        <span>📂 Client: <strong>{task.client.name}</strong></span>
                      )}
                      <span>👤 Assignee: <strong>{task.assignedTo || "Unassigned"}</strong></span>
                      {task.dueDate && (
                        <span>📅 Due: <strong>{new Date(task.dueDate).toLocaleDateString()}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "24px" }}>
                    {task.status === "TODO" && (
                      <button 
                        onClick={() => handleQuickStatusChange(task, "IN_PROGRESS")}
                        style={{ padding: "6px 12px", background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#2563EB", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        Start Work
                        <ArrowRight size={12} />
                      </button>
                    )}
                    {task.status === "IN_PROGRESS" && (
                      <button 
                        onClick={() => handleQuickStatusChange(task, "DONE")}
                        style={{ padding: "6px 12px", background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        Complete
                        <CheckCircle size={12} />
                      </button>
                    )}
                    {task.status === "DONE" && (
                      <span style={{ fontSize: "11px", color: "#16A34A", fontWeight: "600", background: "#DCFCE7", padding: "4px 8px", borderRadius: "12px" }}>
                        ✓ Done
                      </span>
                    )}
                    <button 
                      onClick={() => openEditModal(task)}
                      style={{ padding: "6px", background: "white", border: "1px solid #E2E8F0", borderRadius: "6px", cursor: "pointer", color: "#64748B" }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: System Logs (30%) */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #F1F5F9", paddingBottom: "12px" }}>
              <Activity size={18} style={{ color: "#0D9488" }} />
              <strong style={{ fontSize: "14px", color: "#0F172A" }}>Admin Audit Feed</strong>
            </div>

            {logs.length === 0 ? (
              <p style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center" }}>No logs recorded.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "500px", overflowY: "auto", paddingRight: "8px" }}>
                {logs.map((log) => (
                  <div key={log.id} style={{ display: "flex", gap: "10px", fontSize: "12px", borderBottom: "1px solid #F8FAFC", paddingBottom: "8px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0D9488", marginTop: "5px", flexShrink: 0 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ color: "#0F172A", fontWeight: "600" }}>{getActivityLogMeta(log.action, log.metadata)}</span>
                      {log.clientName && (
                        <span style={{ color: "#64748B", fontSize: "11px" }}>Client: {log.clientName}</span>
                      )}
                      <span style={{ color: "#94A3B8", fontSize: "10px" }}>
                        {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div className={modalStyles.overlay} onClick={() => setIsModalOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>
                {modalMode === "create" ? "Create Administrative Task" : "Edit Task Configuration"}
              </span>
              <button onClick={() => setIsModalOpen(false)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveTask} className={modalStyles.body}>
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
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Set up Search Console properties"
                  required
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Description (Optional)</label>
                <textarea
                  className={modalStyles.input}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Detail task objectives, URL pointers, etc."
                  style={{ minHeight: "80px", resize: "vertical", padding: "8px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Status</label>
                  <select
                    className={modalStyles.input}
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Priority</label>
                  <select
                    className={modalStyles.input}
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Client Assignment (Optional)</label>
                <select
                  className={modalStyles.input}
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                >
                  <option value="">-- No Client Assigned --</option>
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Assigned Agent</label>
                  <input
                    type="text"
                    className={modalStyles.input}
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    placeholder="e.g. Sarah J."
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Due Date</label>
                  <input
                    type="date"
                    className={modalStyles.input}
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                </div>
              </div>
            </form>
            <div className={modalStyles.footer} style={{ display: "flex", justifyContent: "space-between" }}>
              {modalMode === "edit" ? (
                <button 
                  onClick={handleDeleteTask} 
                  className={modalStyles.btn} 
                  style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  disabled={isSaving}
                >
                  <Trash2 size={13} />
                  Delete Task
                </button>
              ) : <div />}
              
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setIsModalOpen(false)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`} disabled={isSaving}>
                  Cancel
                </button>
                <button onClick={handleSaveTask} className={`${modalStyles.btn} ${modalStyles.btnSave}`} disabled={isSaving}>
                  {isSaving ? "Saving..." : modalMode === "create" ? "Create Task" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
