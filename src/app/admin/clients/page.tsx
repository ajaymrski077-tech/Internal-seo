"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  Plus, 
  Edit2, 
  Eye, 
  Archive, 
  RotateCcw, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  Database, 
  Settings,
  Link as LinkIcon,
  Check,
  MoreVertical,
  X,
  User,
  Calendar,
  FileText,
  AlertCircle
} from "lucide-react";
import styles from "@/styles/Clients.module.css";
import { useToast } from "@/components/ToastContext";
import { useConfirm } from "@/components/ConfirmContext";
import { handleApiError } from "@/lib/apiUtils";
import { ClientListItem } from "@/services/clientService";

export default function ClientsPage() {
  // Query parameters states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [integrationFilter, setIntegrationFilter] = useState("ALL");
  const [archiveFilter, setArchiveFilter] = useState("ACTIVE_ONLY");
  const [sortBy, setSortBy] = useState("name_asc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6); // 6 clients per page for nice visual density

  // Data states
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);

  // Close menus on outer click
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Modal Open states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeClientId, setActiveClientId] = useState<string | number | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formLogoUrl, setFormLogoUrl] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [formManagerName, setFormManagerName] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast, success, error: toastError } = useToast();
  const { confirm } = useConfirm();

  // Fetch clients payload
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qParams = new URLSearchParams({
        search,
        status: statusFilter,
        integration: integrationFilter,
        archived: archiveFilter,
        sort: sortBy,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const res = await fetch(`/api/clients?${qParams}`);
      if (!res.ok) {
        throw new Error("Failed to load clients list.");
      }
      const data = await res.json();
      setClients(data.clients);
      setTotalCount(data.totalCount);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, integrationFilter, archiveFilter, sortBy, page, pageSize]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Handle Search input with page resets
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Reset pagination on filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === "status") setStatusFilter(value);
    if (filterType === "integration") setIntegrationFilter(value);
    if (filterType === "archive") setArchiveFilter(value);
    if (filterType === "sort") setSortBy(value);
    setPage(1);
  };

  // Clipboard copy handler for secure share links
  const handleCopyLink = async (clientId: string | number, token: string | null) => {
    if (!token) {
      toastError("No share link available. Edit client to generate token.");
      return;
    }
    const origin = window.location.origin;
    const shareUrl = `${origin}/share/${token}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(clientId);
      setTimeout(() => setCopiedId(null), 2000);
      success("Share link copied to clipboard.");
    } catch {
      toastError("Failed to copy link to clipboard.");
    }
  };

  // Share Token Regeneration handler
  const handleRegenerateToken = async (clientId: string | number) => {
    const isConfirmed = await confirm({
      title: "Regenerate Share Link",
      message: "Are you sure you want to invalidate the existing share link and create a new one? The old link will stop working.",
      confirmText: "Regenerate",
      destructive: true
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/clients/${clientId}/share-token`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Failed to regenerate token.");
      }
      success("Secure share link regenerated successfully.");
      fetchClients();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to regenerate token." });
    }
  };

  // Open creation modal
  const openCreateModal = () => {
    setFormMode("create");
    setFormName("");
    setFormCompanyName("");
    setFormDomain("");
    setFormLogoUrl("");
    setFormStatus("ACTIVE");
    setFormManagerName("");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormNotes("");
    setFormError("");
    setIsFormOpen(true);
  };

  // Open edit modal
  const openEditModal = async (client: ClientListItem) => {
    setFormMode("edit");
    setActiveClientId(client.id);
    setFormName(client.name);
    setFormCompanyName(client.companyName || "");
    setFormDomain(client.primaryDomain);
    setFormLogoUrl(client.logoUrl || "");
    setFormStatus(client.status);
    setFormManagerName(client.managerName || "");
    setFormStartDate(
      client.startDate 
        ? new Date(client.startDate).toISOString().split("T")[0] 
        : new Date().toISOString().split("T")[0]
    );
    setFormNotes(client.notes || "");
    setFormError("");
    setIsFormOpen(true);
  };

  // Client Creation / Update form submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim() || !formDomain.trim()) {
      setFormError("Client name and Website domain are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const bodyPayload = {
        name: formName,
        companyName: formCompanyName || undefined,
        domain: formDomain,
        logoUrl: formLogoUrl || undefined,
        status: formStatus,
        managerName: formManagerName || undefined,
        notes: formNotes || undefined,
        startDate: formStartDate || undefined,
      };

      let url = "/api/clients";
      let method = "POST";

      if (formMode === "edit" && activeClientId) {
        url = `/api/clients/${activeClientId}`;
        method = "PATCH";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to save client details.");
      }

      setIsFormOpen(false);
      success(`Client ${formMode === "create" ? "created" : "updated"} successfully.`);
      fetchClients();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message || "An error occurred while saving.");
      } else {
        setFormError("An error occurred while saving.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Archiving/Soft-Deleting handler
  const handleArchiveClient = async (clientId: string | number, name: string) => {
    const isConfirmed = await confirm({
      title: "Archive Client",
      message: `Are you sure you want to archive '${name}'? This client will disappear from default metrics, dashboard charts, and portfolios, but historical analytics data will remain intact.`,
      confirmText: "Archive",
      destructive: true
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to archive client.");
      }

      success("Client archived successfully.");
      fetchClients();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to archive client." });
    }
  };

  // Restoring client handler
  const handleRestoreClient = async (clientId: string | number) => {
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false, status: "ACTIVE" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to restore client.");
      }

      success("Client restored successfully.");
      fetchClients();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to restore client." });
    }
  };

  // Pagination bounds
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Generate list of page numbers to render
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.title}>Clients</h1>
          <span className={styles.subtitle}>
            Manage your client portfolios, primary domains, and OAuth tracking integrations.
          </span>
        </div>
        <button className={styles.btnAddClient} onClick={openCreateModal}>
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {/* Filter Options Row */}
      <div className={styles.controlsRow}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by client name, company, or domain..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className={styles.filtersGroup}>
          {/* Status filter */}
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ONBOARDING">Onboarding</option>
            <option value="PAUSED">Paused</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Integration filter */}
          <select
            className={styles.filterSelect}
            value={integrationFilter}
            onChange={(e) => handleFilterChange("integration", e.target.value)}
          >
            <option value="ALL">All Integrations</option>
            <option value="GA4_CONNECTED">GA4 Connected</option>
            <option value="GA4_NOT_CONNECTED">GA4 Disconnected</option>
            <option value="GSC_CONNECTED">GSC Connected</option>
            <option value="GSC_NOT_CONNECTED">GSC Disconnected</option>
          </select>

          {/* Archive filter */}
          <select
            className={styles.filterSelect}
            value={archiveFilter}
            onChange={(e) => handleFilterChange("archive", e.target.value)}
          >
            <option value="ACTIVE_ONLY">Active Portfolios</option>
            <option value="ARCHIVED_ONLY">Archived Portfolios</option>
            <option value="ALL">All Accounts</option>
          </select>

          {/* Sort selector */}
          <select
            className={styles.filterSelect}
            value={sortBy}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
          >
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="updated">Recently updated</option>
          </select>
        </div>
      </div>

      {/* Main clients grid table */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className={styles.emptyContainer} style={{ borderColor: "var(--error)" }}>
          <AlertCircle size={32} style={{ color: "var(--error)" }} />
          <span className={styles.emptyTitle}>Error loading clients</span>
          <span className={styles.emptyText}>{error}</span>
          <button className={styles.btnPage} onClick={fetchClients}>Retry</button>
        </div>
      ) : clients.length === 0 ? (
        <div className={styles.emptyContainer}>
          <AlertCircle size={32} style={{ color: "var(--text-muted)" }} />
          <span className={styles.emptyTitle}>No clients found</span>
          <span className={styles.emptyText}>
            {search || statusFilter !== "ALL" || integrationFilter !== "ALL" || archiveFilter !== "ACTIVE_ONLY"
              ? "No clients match your filter parameters. Try clearing your search query or sorting options."
              : "Start by registering your first client property with GSC/GA4 integrations."}
          </span>
          {(!search && statusFilter === "ALL" && integrationFilter === "ALL" && archiveFilter === "ACTIVE_ONLY") && (
            <button className={styles.btnAddClient} onClick={openCreateModal} style={{ marginTop: "8px" }}>
              <Plus size={16} />
              Add First Client
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Website / Domain</th>
                  <th>GA4 Property</th>
                  <th>GSC Property</th>
                  <th>Google Account</th>
                  <th>Status</th>
                  <th style={{ width: "80px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  return (
                    <tr key={client.id}>
                      {/* Identity */}
                      <td>
                        <div className={styles.clientCell}>
                          <div className={styles.avatar}>
                            {client.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                          </div>
                          <div className={styles.clientMeta}>
                            <Link href={`/admin/clients/${client.id}`} className={styles.clientName}>
                              {client.name}
                            </Link>
                            {client.companyName && (
                              <span className={styles.companyName}>{client.companyName}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Domain link */}
                      <td>
                        <div className={styles.domainWrapper}>
                          <a 
                            href={`https://${client.primaryDomain}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.domainLink}
                          >
                            {client.primaryDomain}
                          </a>
                          <ExternalLink size={12} style={{ opacity: 0.4 }} />
                        </div>
                      </td>

                      {/* GA4 */}
                      <td>
                        <span className={`${styles.badge} ${
                          client.ga4Status === "CONNECTED" 
                            ? styles.connected 
                            : client.ga4Status === "SYNC_ERROR" 
                            ? styles.syncError 
                            : styles.disconnected
                        }`}>
                          {client.ga4Status === "CONNECTED" 
                            ? "Connected" 
                            : client.ga4Status === "SYNC_ERROR" 
                            ? "Sync Error" 
                            : "Disconnected"}
                        </span>
                      </td>

                      {/* GSC */}
                      <td>
                        <span className={`${styles.badge} ${
                          client.gscStatus === "CONNECTED" 
                            ? styles.connected 
                            : styles.gscStatus === "SYNC_ERROR" 
                            ? styles.syncError 
                            : styles.disconnected
                        }`}>
                          {client.gscStatus === "CONNECTED" 
                            ? "Connected" 
                            : client.gscStatus === "SYNC_ERROR" 
                            ? "Sync Error" 
                            : "Disconnected"}
                        </span>
                      </td>

                      {/* Account Connection */}
                      <td>
                        <span className={`${styles.badge} ${client.googleAccountConnected ? styles.connected : styles.disconnected}`}>
                          {client.googleAccountConnected ? "Connected" : "Disconnected"}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`${styles.statusLabel} ${styles[client.status.toLowerCase()]}`}>
                          {client.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right", overflow: "visible" }}>
                        <div className={styles.menuContainer}>
                          <button
                            className={`${styles.btnThreeDot} ${activeMenuId === client.id ? styles.active : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === client.id ? null : client.id);
                            }}
                            title="Actions menu"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuId === client.id && (
                            <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                              <Link href={`/admin/clients/${client.id}`} className={styles.dropdownItem}>
                                <Eye size={14} />
                                View Workspace
                              </Link>
                              
                              <button 
                                type="button"
                                className={styles.dropdownItem} 
                                onClick={() => {
                                  setActiveMenuId(null);
                                  openEditModal(client);
                                }}
                              >
                                <Edit2 size={14} />
                                Edit Details
                              </button>

                              <button 
                                type="button"
                                className={styles.dropdownItem} 
                                onClick={() => handleCopyLink(client.id, client.shareToken)}
                              >
                                {copiedId === client.id ? (
                                  <Check size={14} style={{ color: "var(--success)" }} />
                                ) : (
                                  <Copy size={14} />
                                )}
                                {copiedId === client.id ? "Copied!" : "Copy Share Link"}
                              </button>

                              <button 
                                type="button"
                                className={styles.dropdownItem} 
                                onClick={() => handleRegenerateToken(client.id)}
                              >
                                <RefreshCw size={13} />
                                Regenerate Link
                              </button>

                              <div style={{ borderTop: "1px solid var(--border-color)", margin: "4px 0" }} />

                              {client.isArchived ? (
                                <button
                                  type="button"
                                  className={`${styles.dropdownItem} ${styles.danger}`}
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleRestoreClient(client.id);
                                  }}
                                >
                                  <RotateCcw size={14} style={{ color: "var(--success)" }} />
                                  Restore Client
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className={`${styles.dropdownItem} ${styles.danger}`}
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleArchiveClient(client.id, client.name);
                                  }}
                                >
                                  <Archive size={14} />
                                  Archive Client
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className={styles.paginationRow}>
              <span>
                Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalCount}</strong> clients
              </span>
              <div className={styles.pagingBtns}>
                <button
                  className={styles.btnPage}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                >
                  ‹
                </button>
                {getPageNumbers().map((p) => (
                  <button
                    key={p}
                    className={`${styles.btnPage} ${page === p ? styles.btnPageActive : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className={styles.btnPage}
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages || totalPages === 0}
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* Mobile responsive Cards Grid */}
          <div className={styles.mobileGrid}>
            {clients.map((client) => (
              <div key={client.id} className={styles.mobileCard}>
                <div className={styles.mobileCardHeader}>
                  <div className={styles.clientCell}>
                    <div className={styles.avatar}>
                      {client.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <div className={styles.clientMeta}>
                      <Link href={`/admin/clients/${client.id}`} className={styles.clientName}>
                        {client.name}
                      </Link>
                      {client.companyName && <span className={styles.companyName}>{client.companyName}</span>}
                    </div>
                  </div>
                  <span className={`${styles.statusLabel} ${styles[client.status.toLowerCase()]}`}>
                    {client.status}
                  </span>
                </div>

                <div className={styles.mobileCardInfoRow}>
                  <span className={styles.mobileInfoLabel}>Website</span>
                  <a 
                    href={`https://${client.primaryDomain}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.domainLink}
                  >
                    {client.primaryDomain}
                  </a>
                </div>

                <div className={styles.mobileCardInfoRow}>
                  <span className={styles.mobileInfoLabel}>GA4 Connection</span>
                  <span className={`${styles.badge} ${
                    client.ga4Status === "CONNECTED" 
                      ? styles.connected 
                      : client.ga4Status === "SYNC_ERROR" 
                      ? styles.syncError 
                      : styles.disconnected
                  }`}>
                    {client.ga4Status}
                  </span>
                </div>

                <div className={styles.mobileCardInfoRow}>
                  <span className={styles.mobileInfoLabel}>GSC Connection</span>
                  <span className={`${styles.badge} ${
                    client.gscStatus === "CONNECTED" 
                      ? styles.connected 
                      : client.gscStatus === "SYNC_ERROR" 
                      ? styles.syncError 
                      : styles.disconnected
                  }`}>
                    {client.gscStatus}
                  </span>
                </div>

                <div className={styles.mobileCardInfoRow}>
                  <span className={styles.mobileInfoLabel}>Share Link</span>
                  <div className={styles.shareWrapper}>
                    <button
                      className={styles.btnShareIcon}
                      onClick={() => handleCopyLink(client.id, client.shareToken)}
                    >
                      {copiedId === client.id ? <Check size={12} style={{ color: "var(--success)" }} /> : <Copy size={12} />}
                    </button>
                    <button
                      className={styles.btnShareIcon}
                      onClick={() => handleRegenerateToken(client.id)}
                    >
                      <RefreshCw size={11} />
                    </button>
                  </div>
                </div>

                <div className={styles.mobileCardActions}>
                  <Link href={`/admin/clients/${client.id}`} className={styles.btnTableAction}>
                    <Eye size={14} />
                  </Link>
                  <button className={styles.btnTableAction} onClick={() => openEditModal(client)}>
                    <Edit2 size={14} />
                  </button>
                  {client.isArchived ? (
                    <button className={`${styles.btnTableAction} ${styles.restore}`} onClick={() => handleRestoreClient(client.id)}>
                      <RotateCcw size={14} />
                    </button>
                  ) : (
                    <button className={`${styles.btnTableAction} ${styles.archive}`} onClick={() => handleArchiveClient(client.id, client.name)}>
                      <Archive size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Mobile Paging */}
            <div className={styles.paginationRow} style={{ background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
              <span>Page {page} of {totalPages || 1}</span>
              <div className={styles.pagingBtns}>
                <button className={styles.btnPage} onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
                  ‹
                </button>
                {getPageNumbers().map((p) => (
                  <button
                    key={p}
                    className={`${styles.btnPage} ${page === p ? styles.btnPageActive : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button className={styles.btnPage} onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages || totalPages === 0}>
                  ›
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Client / Edit Client Form dialog */}
      {isFormOpen && (
        <div className={styles.dialogOverlay} onClick={() => setIsFormOpen(false)}>
          <div className={styles.dialogModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <span className={styles.dialogTitle}>
                {formMode === "create" ? "Add New Client" : "Edit Client Configuration"}
              </span>
              <button className={styles.dialogCloseBtn} onClick={() => setIsFormOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className={styles.dialogBody}>
                {formError && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(239, 68, 68, 0.05)",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    color: "var(--error)",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.8125rem"
                  }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className={styles.formGrid}>
                  {/* Name */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Client Name *</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. Acme Corp"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Company name */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Company Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. Acme Industries Ltd"
                      value={formCompanyName}
                      onChange={(e) => setFormCompanyName(e.target.value)}
                    />
                  </div>

                {/* Domain website */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Website URL / Domain *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. acmecorp.com"
                    value={formDomain}
                    onChange={(e) => setFormDomain(e.target.value)}
                    required
                  />
                </div>

                {/* Account Manager */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Account Manager</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className={styles.formInput}
                      style={{ width: "100%", paddingLeft: "36px" }}
                      placeholder="e.g. Sarah Jenkins"
                      value={formManagerName}
                      onChange={(e) => setFormManagerName(e.target.value)}
                    />
                    <User size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  </div>
                </div>

                {/* Start Date */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Campaign Start Date</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="date"
                      className={styles.formInput}
                      style={{ width: "100%", paddingLeft: "36px" }}
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                    />
                    <Calendar size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  </div>
                </div>

                {/* Status selector */}
                {formMode === "create" && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Initial Status</label>
                    <select
                      className={styles.filterSelect}
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="ONBOARDING">Onboarding</option>
                      <option value="PAUSED">Paused</option>
                    </select>
                  </div>
                )}

                {formMode === "edit" && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Status</label>
                    <select
                      className={styles.filterSelect}
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="ONBOARDING">Onboarding</option>
                      <option value="PAUSED">Paused</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                )}

                  {/* Notes */}
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.formLabel}>Internal Notes</label>
                    <div style={{ position: "relative" }}>
                      <textarea
                        className={styles.formTextarea}
                        style={{ paddingLeft: "36px" }}
                        placeholder="Enter internal client accounts summary notes here..."
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                      />
                      <FileText size={14} style={{ position: "absolute", left: "12px", top: "14px", color: "var(--text-muted)" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.dialogFooter}>
                <button type="button" className={styles.btnDialogCancel} onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnDialogSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : formMode === "create" ? "Add Client" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
