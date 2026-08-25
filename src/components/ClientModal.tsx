"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Link as LinkIcon, FileText, CheckCircle, RefreshCw } from "lucide-react";
import styles from "@/styles/ClientModal.module.css";
import { useToast } from "@/components/ToastContext";
import { handleApiError } from "@/lib/apiUtils";

interface ClientModalProps {
  clientId: string | number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Triggered after saving edits to reload dashboard data
}

interface ConnectionDetail {
  id: string | number;
  provider: string;
  status: string;
  syncStatus: string | null;
  syncError: string | null;
  lastSyncTime: string | null;
}

interface PropertyDetail {
  id: string | number;
  domain: string;
  name: string;
  connections: ConnectionDetail[];
}

interface ClientDetail {
  id: number;
  name: string;
  companyName: string | null;
  status: string;
  isArchived: boolean;
  properties: PropertyDetail[];
  deliveryEvents: Array<{
    id: number;
    type: string;
    date: string;
    description: string;
    contentDetails?: {
      title: string;
      url: string;
      wordCount: number;
    } | null;
    linkDetails?: {
      url: string;
      anchorText: string;
      targetUrl: string;
      domainAuthority: number;
    } | null;
  }>;
}

export default function ClientModal({ clientId, isOpen, onClose, onSuccess }: ClientModalProps) {
  const [activeTab, setActiveTab] = useState<"view" | "edit">("view");
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  
  // Form fields for editing
  const [editName, setEditName] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editIsArchived, setEditIsArchived] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const { success, error: toastError } = useToast();

  // Fetch client details
  useEffect(() => {
    if (!isOpen) return;
    
    async function fetchClient() {
      setLoading(true);
      setLoadError("");
      setFormError("");
      try {
        const res = await fetch(`/api/clients/${clientId}`);
        if (!res.ok) {
          throw new Error("Failed to load client details");
        }
        const data = await res.json();
        setClient(data);
        setEditName(data.name);
        setEditCompanyName(data.companyName || "");
        setEditDomain(data.properties?.[0]?.domain || "");
        setEditIsArchived(data.isArchived);
      } catch (err: unknown) {
        handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to load client details." });
        setLoadError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchClient();
  }, [clientId, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editDomain.trim()) {
      // Validation error — keep inline, not a toast
      setFormError("Name and domain cannot be empty.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          companyName: editCompanyName || null,
          domain: editDomain,
          isArchived: editIsArchived,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update client configuration");
      }

      success("Client updated successfully.");
      onSuccess(); // reload parent dashboard
      onClose();   // close modal
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to save client changes." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>
            {loading ? "Loading Client..." : client?.name}
          </span>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        {!loading && !loadError && (
          <div className={styles.tabs}>
            <button
              onClick={() => setActiveTab("view")}
              className={`${styles.tabBtn} ${activeTab === "view" ? styles.activeTab : ""}`}
            >
              View Deliveries
            </button>
            <button
              onClick={() => setActiveTab("edit")}
              className={`${styles.tabBtn} ${activeTab === "edit" ? styles.activeTab : ""}`}
            >
              Edit Configuration
            </button>
          </div>
        )}

        {/* Body */}
        <div className={styles.body}>
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
              <div className="spinner" />
            </div>
          )}

          {loadError && <div className={styles.errorMessage}>{loadError}</div>}

          {!loading && !loadError && client && (
            <>
              {activeTab === "view" ? (
                /* View Deliveries Timeline */
                <div className={styles.timelineContainer}>
                  {/* Property details banner */}
                  <div style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px",
                    marginBottom: "20px",
                    fontSize: "0.8125rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}>
                    {client.companyName && (
                      <div><strong>Company Name:</strong> {client.companyName}</div>
                    )}
                    {client.properties.map((prop, idx) => (
                      <div key={prop.id} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div><strong>Property {idx + 1}:</strong> {prop.name} ({prop.domain})</div>
                        <div style={{ display: "flex", gap: "8px", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {prop.connections.map(conn => (
                            <span key={conn.id} style={{
                              color: conn.status === "CONNECTED" ? "var(--success)" : conn.status === "SYNC_ERROR" ? "var(--error)" : "var(--text-muted)"
                            }}>
                              • {conn.provider}: {conn.status}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {client.deliveryEvents.length === 0 ? (
                    <div className={styles.noEvents}>No delivery events recorded for this client.</div>
                  ) : (
                    <div className={styles.timeline}>
                      {client.deliveryEvents.map((event) => {
                        const isLink = event.type === "BACKLINK";
                        return (
                          <div key={event.id} className={styles.timelineItem}>
                            <div className={`${styles.timelineDot} ${isLink ? styles.backlink : styles.content}`} />
                            <div className={styles.timelineHeader}>
                              <span className={styles.timelineDate}>
                                {new Date(event.date).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className={`${styles.timelineType} ${isLink ? styles.backlink : styles.content}`}>
                                {event.type}
                              </span>
                            </div>
                            <div className={styles.timelineDesc}>{event.description}</div>

                            {/* Event Details Card */}
                            {isLink && event.linkDetails && (
                              <div className={styles.timelineDetailsCard}>
                                <div className={styles.timelineDetailsRow}>
                                  <span>Anchor Text:</span>
                                  <span className={styles.timelineValue}>"{event.linkDetails.anchorText}"</span>
                                </div>
                                <div className={styles.timelineDetailsRow}>
                                  <span>Target URL:</span>
                                  <span className={styles.timelineValue}>{event.linkDetails.targetUrl}</span>
                                </div>
                                <div className={styles.timelineDetailsRow}>
                                  <span>Domain Authority:</span>
                                  <span className={styles.timelineValue}>{event.linkDetails.domainAuthority} DA</span>
                                </div>
                                <div className={styles.timelineDetailsRow} style={{ marginTop: "4px" }}>
                                  <span>Live Placement:</span>
                                  <a 
                                    href={event.linkDetails.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className={styles.timelineLink}
                                  >
                                    View Article Link
                                  </a>
                                </div>
                              </div>
                            )}

                            {!isLink && event.contentDetails && (
                              <div className={styles.timelineDetailsCard}>
                                <div className={styles.timelineDetailsRow}>
                                  <span>Title:</span>
                                  <span className={styles.timelineValue}>"{event.contentDetails.title}"</span>
                                </div>
                                <div className={styles.timelineDetailsRow}>
                                  <span>Word Count:</span>
                                  <span className={styles.timelineValue}>{event.contentDetails.wordCount} words</span>
                                </div>
                                <div className={styles.timelineDetailsRow} style={{ marginTop: "4px" }}>
                                  <span>Live Link:</span>
                                  <a 
                                    href={event.contentDetails.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className={styles.timelineLink}
                                  >
                                    View Published Post
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Configuration Form */
                <form onSubmit={handleSave} className={styles.form}>
                  {formError && <div className={styles.errorMessage}>{formError}</div>}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Client Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Company Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Acme Industries Ltd"
                      value={editCompanyName}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Primary Website / Domain</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={editDomain}
                      onChange={(e) => setEditDomain(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Archived Status</label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={editIsArchived}
                        onChange={(e) => setEditIsArchived(e.target.checked)}
                      />
                      <span>Archive this client (removes from active portfolio view)</span>
                    </label>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button onClick={onClose} className={`${styles.btn} ${styles.btnCancel}`} disabled={isSaving}>
            Close
          </button>
          {activeTab === "edit" && !loading && !loadError && (
            <button onClick={handleSave} className={`${styles.btn} ${styles.btnSave}`} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
