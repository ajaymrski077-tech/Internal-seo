"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/SharedModule.module.css";
import modalStyles from "@/styles/ClientModal.module.css";
import { Settings, Plus, X, AlertCircle, Trash2 } from "lucide-react";

interface Ticket {
  id: number;
  subject: string;
  clientId: number;
  client: { name: string };
  fromName: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  updatedAt: string;
}

export default function TicketsPage() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clientsList, setClientsList] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  // Form Fields
  const [formSubject, setFormSubject] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formFromName, setFormFromName] = useState("");
  const [formStatus, setFormStatus] = useState("open");
  const [formPriority, setFormPriority] = useState("normal");
  const [formAssignedTo, setFormAssignedTo] = useState("—");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoading(false);
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

  // Fetch from the real database API
  useEffect(() => {
    fetchTickets();
    fetchClients();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setActiveTicket(null);
    setFormSubject("");
    setFormClientId(clientsList[0]?.id.toString() || "");
    setFormFromName("Client Admin");
    setFormStatus("open");
    setFormPriority("normal");
    setFormAssignedTo("—");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (ticket: Ticket) => {
    setModalMode("edit");
    setActiveTicket(ticket);
    setFormSubject(ticket.subject);
    setFormClientId(ticket.clientId?.toString() || "");
    setFormFromName(ticket.fromName);
    setFormStatus(ticket.status);
    setFormPriority(ticket.priority);
    setFormAssignedTo(ticket.assignedTo || "—");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formClientId || !formFromName.trim()) {
      setErrorMsg("Subject, Client, and From name are required.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    
    try {
      const payload = {
        subject: formSubject.trim(),
        clientId: parseInt(formClientId, 10),
        fromName: formFromName.trim(),
        status: formStatus,
        priority: formPriority,
        assignedTo: formAssignedTo,
      };

      const url = modalMode === "create" 
        ? "/api/tickets" 
        : `/api/tickets/${activeTicket?.id}`;
      const method = modalMode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || "Failed to save ticket.");
      }

      setIsModalOpen(false);
      fetchTickets();
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMsg(errObj?.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!activeTicket) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this support ticket?");
    if (!confirmDelete) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete ticket.");
      setIsModalOpen(false);
      fetchTickets();
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMsg(errObj?.message || "Failed to delete ticket");
    } finally {
      setIsSaving(false);
    }
  };

  // Compute filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "All" && t.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (clientFilter !== "All" && t.client?.name !== clientFilter) {
      return false;
    }
    return true;
  });

  const activeTickets = filteredTickets.filter(t => t.status !== "closed");
  const closedTickets = filteredTickets.filter(t => t.status === "closed");

  const getStatusBadge = (status: string) => {
    let bg = "#F1F5F9";
    let color = "#64748B";
    const s = status.toLowerCase();
    
    if (s === "in progress") { bg = "#FFF7ED"; color = "#EA580C"; }
    else if (s === "open") { bg = "#EFF6FF"; color = "#3B82F6"; }
    else if (s === "closed") { bg = "#F8FAFC"; color = "#94A3B8"; }
    else if (s === "pending") { bg = "#F3E8FF"; color = "#9333EA"; }
    
    return (
      <span style={{ background: bg, color, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", whiteSpace: "nowrap" }}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    let bg = "#F1F5F9";
    let color = "#64748B";
    const p = priority.toLowerCase();
    
    if (p === "high") { bg = "#FFF7ED"; color = "#EA580C"; }
    else if (p === "normal") { bg = "#F1F5F9"; color = "#475569"; }
    else if (p === "urgent") { bg = "#FEF2F2"; color = "#EF4444"; }
    else if (p === "low") { bg = "#F0FDF4"; color = "#16A34A"; }
    
    return (
      <span style={{ background: bg, color, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", whiteSpace: "nowrap", textTransform: "capitalize" }}>
        {priority}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.container} style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className={styles.title} style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>Support Tickets</h1>
        <button 
          onClick={openCreateModal}
          style={{ padding: "8px 16px", background: "#0D9488", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={14} />
          New Ticket
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ background: "white", padding: "16px 24px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "24px", display: "flex", alignItems: "center", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#64748B" }}>Status:</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", background: "white", minWidth: "120px" }}>
            <option value="All">All</option>
            <option value="open">Open</option>
            <option value="in progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#64748B" }}>Client:</span>
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", background: "white", minWidth: "160px" }}>
            <option value="All">All</option>
            {clientsList.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <button onClick={fetchTickets} style={{ padding: "6px 16px", background: "#0D9488", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>Filter</button>
        <button onClick={() => { setStatusFilter("All"); setClientFilter("All"); }} style={{ padding: "6px 16px", background: "white", color: "#0F172A", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>Clear</button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {/* Active Tickets Table */}
          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden", marginBottom: "32px" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
              Active Tickets ({activeTickets.length})
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>#</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>Subject</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>Client</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>From</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>Priority</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>Assigned</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {activeTickets.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#94A3B8" }}>No active tickets</td></tr>
                ) : (
                  activeTickets.map((ticket, i) => (
                    <tr 
                      key={ticket.id} 
                      style={{ borderTop: i === 0 ? "none" : "1px solid #F1F5F9", transition: "background 0.2s", cursor: "pointer" }} 
                      onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} 
                      onMouseLeave={e => e.currentTarget.style.background = "white"}
                      onClick={() => openEditModal(ticket)}
                    >
                      <td style={{ padding: "16px 24px", color: "#64748B" }}>{ticket.id}</td>
                      <td style={{ padding: "16px 24px", color: "#0F172A", fontWeight: "500", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.subject}</td>
                      <td style={{ padding: "16px 24px", color: "#475569" }}>{ticket.client?.name}</td>
                      <td style={{ padding: "16px 24px", color: "#475569" }}>{ticket.fromName}</td>
                      <td style={{ padding: "16px 24px" }}>{getStatusBadge(ticket.status)}</td>
                      <td style={{ padding: "16px 24px" }}>{getPriorityBadge(ticket.priority)}</td>
                      <td style={{ padding: "16px 24px", color: "#64748B" }}>{ticket.assignedTo || "—"}</td>
                      <td style={{ padding: "16px 24px", color: "#64748B" }}>{formatDate(ticket.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Closed Tickets Table */}
          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden", opacity: 0.85 }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", fontSize: "14px", fontWeight: "600", color: "#475569" }}>
              Closed Tickets ({closedTickets.length})
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", color: "#94A3B8", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>#</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>Subject</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>Client</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>From</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>Priority</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>Assigned</th>
                  <th style={{ padding: "12px 24px", fontWeight: "600" }}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {closedTickets.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#94A3B8" }}>No closed tickets</td></tr>
                ) : (
                  closedTickets.map((ticket, i) => (
                    <tr 
                      key={ticket.id} 
                      style={{ borderTop: i === 0 ? "none" : "1px solid #F1F5F9", color: "#94A3B8", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} 
                      onMouseLeave={e => e.currentTarget.style.background = "white"}
                      onClick={() => openEditModal(ticket)}
                    >
                      <td style={{ padding: "16px 24px" }}>{ticket.id}</td>
                      <td style={{ padding: "16px 24px", maxWidth: "400px", lineHeight: "1.4" }}>{ticket.subject}</td>
                      <td style={{ padding: "16px 24px" }}>{ticket.client?.name}</td>
                      <td style={{ padding: "16px 24px" }}>{ticket.fromName}</td>
                      <td style={{ padding: "16px 24px" }}>{getStatusBadge(ticket.status)}</td>
                      <td style={{ padding: "16px 24px" }}>{getPriorityBadge(ticket.priority)}</td>
                      <td style={{ padding: "16px 24px" }}>{ticket.assignedTo || "—"}</td>
                      <td style={{ padding: "16px 24px" }}>{formatDate(ticket.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Ticket Modal */}
      {isModalOpen && (
        <div className={modalStyles.overlay} onClick={() => setIsModalOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>
                {modalMode === "create" ? "Add New Support Ticket" : "Edit Ticket Configuration"}
              </span>
              <button onClick={() => setIsModalOpen(false)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveTicket} className={modalStyles.body}>
              {errorMsg && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", padding: "12px", borderRadius: "6px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem" }}>
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Ticket Subject</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="e.g. Broken links on resources page"
                  required
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Assign to Client</label>
                <select
                  className={modalStyles.input}
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  required
                >
                  <option value="">-- Select Client --</option>
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Sender Name (From)</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={formFromName}
                  onChange={(e) => setFormFromName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
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
                    <option value="open">Open</option>
                    <option value="in progress">In Progress</option>
                    <option value="pending">Pending</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Priority</label>
                  <select
                    className={modalStyles.input}
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Assigned Agent</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={formAssignedTo}
                  onChange={(e) => setFormAssignedTo(e.target.value)}
                  placeholder="e.g. Sarah J. (or —)"
                />
              </div>
            </form>
            <div className={modalStyles.footer} style={{ display: "flex", justifyContent: "space-between" }}>
              {modalMode === "edit" ? (
                <button 
                  onClick={handleDeleteTicket} 
                  className={modalStyles.btn} 
                  style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  disabled={isSaving}
                >
                  <Trash2 size={13} />
                  Delete Ticket
                </button>
              ) : <div />}
              
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setIsModalOpen(false)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`} disabled={isSaving}>
                  Cancel
                </button>
                <button onClick={handleSaveTicket} className={`${modalStyles.btn} ${modalStyles.btnSave}`} disabled={isSaving}>
                  {isSaving ? "Saving..." : modalMode === "create" ? "Add Ticket" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
