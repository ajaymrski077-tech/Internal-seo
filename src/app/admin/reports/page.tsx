"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FileText,
  Search,
  Plus,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  RefreshCw,
  Copy,
  Filter,
  Link as LinkIcon,
  X
} from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";
import { useConfirm } from "@/components/ConfirmContext";
import { handleApiError } from "@/lib/apiUtils";

interface ClientOption {
  id: number;
  name: string;
  companyName: string | null;
  properties: Array<{ id: number; domain: string }>;
}

interface ReportListItem {
  id: number;
  name: string;
  clientId: number;
  propertyId: number | null;
  dateRange: string;
  startDate: string;
  endDate: string;
  comparisonRange: string;
  status: string;
  shareToken: string | null;
  createdAt: string;
  client: { id: number; name: string; companyName: string | null };
  property: { id: number; domain: string; name: string } | null;
}

export default function ReportsPage() {
  const router = useRouter();
  const { toast, success, error } = useToast();
  const { confirm } = useConfirm();

  // Search & Filter States
  const [search, setSearch] = useState("");
  const [selectedClientFilter, setSelectedClientFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Loaded Data States
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Create Modal Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formClientId, setFormClientId] = useState("");
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formReportName, setFormReportName] = useState("");
  const [formDateRange, setFormDateRange] = useState("30d");
  const [formCustomStart, setFormCustomStart] = useState("");
  const [formCustomEnd, setFormCustomEnd] = useState("");
  const [formComparison, setFormComparison] = useState("PREV_PERIOD");
  const [formSections, setFormSections] = useState<string[]>([
    "overview",
    "sessions",
    "organic",
    "conversions",
    "deliveries"
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Dropdown state (which report action popup is open)
  const [activeDropdownReportId, setActiveDropdownReportId] = useState<number | null>(null);
  const [copiedReportId, setCopiedReportId] = useState<number | null>(null);

  // Fetch paginated reports list
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const clientQuery = selectedClientFilter !== "ALL" ? `&clientId=${selectedClientFilter}` : "";
      const statusQuery = selectedStatusFilter !== "ALL" ? `&status=${selectedStatusFilter}` : "";
      const searchQuery = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : "";
      
      const res = await fetch(
        `/api/reports?page=${currentPage}&pageSize=8&sort=${selectedSort}${clientQuery}${statusQuery}${searchQuery}`
      );
      if (!res.ok) throw new Error("Failed to load reports.");
      const data = await res.json();
      setReports(data.reports);
      setTotalReports(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      const errObj = err as Error;
      setPageError(errObj?.message || "Failed to load reports ledger.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedClientFilter, selectedStatusFilter, search, selectedSort]);

  // Load clients options for creation modal and filters
  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients?pageSize=100");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error("Failed to load clients options:", err);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Document listener to close dropdowns
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownReportId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Sync default report name when client changes
  useEffect(() => {
    if (formClientId) {
      const client = clients.find(c => c.id === parseInt(formClientId, 10));
      if (client) {
        const now = new Date();
        const monthName = now.toLocaleString("default", { month: "long" });
        const year = now.getFullYear();
        setFormReportName(`${client.name} - ${monthName} ${year} SEO Report`);
        
        // Auto-select first property if any
        if (client.properties && client.properties.length > 0) {
          setFormPropertyId(client.properties[0].id.toString());
        } else {
          setFormPropertyId("");
        }
      }
    } else {
      setFormReportName("");
      setFormPropertyId("");
    }
  }, [formClientId, clients]);

  // Create report handler
  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId || !formReportName.trim()) {
      error("Please select a client and provide a report name.");
      return;
    }
    if (formDateRange === "custom" && (!formCustomStart || !formCustomEnd)) {
      error("Please provide start and end dates for the custom range.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        clientId: parseInt(formClientId, 10),
        propertyId: formPropertyId ? parseInt(formPropertyId, 10) : null,
        name: formReportName.trim(),
        dateRange: formDateRange,
        startDate: formDateRange === "custom" ? new Date(formCustomStart) : undefined,
        endDate: formDateRange === "custom" ? new Date(formCustomEnd) : undefined,
        comparisonRange: formComparison,
        sections: formSections
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create report.");
      }

      const resData = await res.json();
      setIsModalOpen(false);
      success("Report record created and snapshot generation started!");
      router.push(`/admin/reports/${resData.reportId}`);
    } catch (err: unknown) {
      handleApiError(err, { toast: { error }, fallbackMessage: "Failed to create report." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Section toggle handler
  const handleToggleSection = (section: string) => {
    if (formSections.includes(section)) {
      setFormSections(formSections.filter(s => s !== section));
    } else {
      setFormSections([...formSections, section]);
    }
  };

  // Copy secure share link
  const handleCopyLink = async (e: React.MouseEvent, shareToken: string | null, id: number) => {
    e.stopPropagation();
    if (!shareToken) return;
    const origin = window.location.origin;
    const shareUrl = `${origin}/share/reports/${shareToken}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedReportId(id);
      setTimeout(() => setCopiedReportId(null), 2000);
      success("Link copied to clipboard");
    } catch {
      error("Failed to copy link.");
    }
  };

  // Archive report action
  const handleArchiveReport = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: "Archive Report",
      message: `Are you sure you want to archive "${name}"?`,
      confirmText: "Archive",
      destructive: true
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to archive report.");
      success("Report archived successfully.");
      fetchReports();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error }, fallbackMessage: "Failed to archive report." });
    }
  };

  // Format date range text helper
  const formatDateRangeText = (report: ReportListItem) => {
    const start = new Date(report.startDate);
    const end = new Date(report.endDate);
    const startStr = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const endStr = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return `${startStr} – ${endStr}`;
  };

  // Slided window pagination logic
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Client Performance Reports</h1>
          <p className={styles.subtitle}>Create, manage, and share print-ready client analytics snapshots</p>
        </div>
        
        <button 
          onClick={() => {
            setFormClientId("");
            setFormPropertyId("");
            setFormReportName("");
            setIsModalOpen(true);
          }}
          className={styles.btnActionPrimary}
        >
          <Plus size={14} style={{ marginRight: "6px" }} />
          Create Report
        </button>
      </div>

      {/* Filters ledger bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search reports by name, client, website..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filtersGroup}>
          <div className={styles.selectWrapper}>
            <select
              value={selectedClientFilter}
              onChange={(e) => { setSelectedClientFilter(e.target.value); setCurrentPage(1); }}
              className={styles.filterSelect}
            >
              <option value="ALL">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <select
              value={selectedStatusFilter}
              onChange={(e) => { setSelectedStatusFilter(e.target.value); setCurrentPage(1); }}
              className={styles.filterSelect}
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="GENERATING">Generating</option>
              <option value="READY">Ready</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <select
              value={selectedSort}
              onChange={(e) => { setSelectedSort(e.target.value); setCurrentPage(1); }}
              className={styles.filterSelect}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="updated">Recently Updated</option>
              <option value="client_name">Client Name</option>
              <option value="report_name">Report Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table container */}
      {loading ? (
        <div className={styles.loaderArea}>
          <div className={styles.spinner} />
        </div>
      ) : pageError ? (
        <div className={styles.errorArea}>
          <AlertCircle size={24} style={{ color: "var(--error)" }} />
          <p>{pageError}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className={styles.emptyArea}>
          <FileText size={48} className={styles.emptyIcon} />
          <h3>No Reports Configured</h3>
          <p>{search ? "No reports match your filters." : "Create your first client performance report to get started."}</p>
          {!search && (
            <button onClick={() => setIsModalOpen(true)} className={styles.btnActionPrimary} style={{ marginTop: "12px" }}>
              <Plus size={14} style={{ marginRight: "6px" }} />
              Create First Report
            </button>
          )}
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Client</th>
                  <th>Domain</th>
                  <th>Reporting Period</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <Link href={`/admin/reports/${report.id}`} className={styles.reportNameLink}>
                        {report.name}
                      </Link>
                    </td>
                    <td>
                      <span className={styles.clientName}>{report.client.name}</span>
                      {report.client.companyName && (
                        <small className={styles.companyName}>{report.client.companyName}</small>
                      )}
                    </td>
                    <td>
                      {report.property ? (
                        <a 
                          href={`https://${report.property.domain}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.domainLink}
                        >
                          {report.property.domain}
                          <ExternalLink size={10} style={{ marginLeft: "4px", opacity: 0.5 }} />
                        </a>
                      ) : (
                        <span className={styles.unassigned}>All properties</span>
                      )}
                    </td>
                    <td>
                      <span className={styles.periodText}>
                        <Calendar size={12} style={{ marginRight: "6px", opacity: 0.7 }} />
                        {formatDateRangeText(report)}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[report.status.toLowerCase()]}`}>
                        {report.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <button
                          className={styles.btnIconAction}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownReportId(
                              activeDropdownReportId === report.id ? null : report.id
                            );
                          }}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {activeDropdownReportId === report.id && (
                          <div 
                            className={styles.actionsDropdown}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link href={`/admin/reports/${report.id}`}>
                              <FileText size={12} />
                              View Report
                            </Link>
                            <button onClick={(e) => handleCopyLink(e, report.shareToken, report.id)}>
                              {copiedReportId === report.id ? <Check size={12} style={{ color: "var(--success)" }} /> : <Share2 size={12} />}
                              {copiedReportId === report.id ? "Copied shared Link" : "Copy Shared Link"}
                            </button>
                            <button onClick={(e) => handleArchiveReport(e, report.id, report.name)} style={{ color: "var(--error)" }}>
                              <Trash2 size={12} />
                              Archive Report
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sliding Window Pagination block */}
          {totalPages > 1 && (
            <div className={styles.paginationBar}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className={styles.btnPaginationArrow}
              >
                <ChevronLeft size={14} />
              </button>
              
              {getPageNumbers().map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`${styles.paginationNumber} ${currentPage === p ? styles.paginationActive : ""}`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className={styles.btnPaginationArrow}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal Form overlay */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Create Performance Report</h3>
            <form onSubmit={handleCreateReport} className={styles.modalForm}>
              
              <div className={styles.formGroup}>
                <label>Select Target Client</label>
                <select
                  required
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="">-- Choose client profile --</option>
                  {clients.filter(c => !c.properties || c.properties.length > 0).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {formClientId && (
                <div className={styles.formGroup}>
                  <label>Select Website Property</label>
                  <select
                    value={formPropertyId}
                    onChange={(e) => setFormPropertyId(e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="">All properties / Aggregated</option>
                    {clients.find(c => c.id === parseInt(formClientId, 10))?.properties.map(p => (
                      <option key={p.id} value={p.id}>{p.domain}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Report Name / Title</label>
                <input
                  type="text"
                  required
                  value={formReportName}
                  onChange={(e) => setFormReportName(e.target.value)}
                  placeholder="e.g. Acme Corp - July 2026 SEO Report"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Reporting Time Range</label>
                <select
                  value={formDateRange}
                  onChange={(e) => setFormDateRange(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last Year</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {formDateRange === "custom" && (
                <div className={styles.formDateRow}>
                  <div className={styles.formGroup}>
                    <label>Start Date</label>
                    <input
                      type="date"
                      required
                      value={formCustomStart}
                      onChange={(e) => setFormCustomStart(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>End Date</label>
                    <input
                      type="date"
                      required
                      value={formCustomEnd}
                      onChange={(e) => setFormCustomEnd(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Comparison Period</label>
                <select
                  value={formComparison}
                  onChange={(e) => setFormComparison(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="PREV_PERIOD">Previous Equivalent Period (Delta)</option>
                  <option value="NONE">No Comparison</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Include Report Sections</label>
                <div className={styles.checkboxGroup}>
                  {[
                    { id: "overview", label: "Executive Summary Metrics" },
                    { id: "sessions", label: "Organic Sessions (GA4)" },
                    { id: "organic", label: "Search Console Clicks (GSC)" },
                    { id: "conversions", label: "Conversions & Goal Metrics" },
                    { id: "deliveries", label: "Completed SEO Deliveries" }
                  ].map((s) => (
                    <label key={s.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formSections.includes(s.id)}
                        onChange={() => handleToggleSection(s.id)}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnActionSecondary}
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnActionPrimary}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Generating snapshot..." : "Create & Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
