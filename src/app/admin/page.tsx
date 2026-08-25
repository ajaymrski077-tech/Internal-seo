"use client";

import { useState, useEffect } from "react";
import { Layers, AlertTriangle, Calendar, CheckCircle, X } from "lucide-react";
import styles from "@/styles/Dashboard.module.css";
import modalStyles from "@/styles/ClientModal.module.css";
import KPICards from "@/components/KPICards";
import DashboardControls from "@/components/DashboardControls";
import ClientCard from "@/components/ClientCard";
import ClientModal from "@/components/ClientModal";
import { DashboardPayload } from "@/services/dashboardService";
import { DeliveryDetail } from "@/services/deliveryService";

export default function AdminDashboard() {
  // Filters & State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [range, setRange] = useState("30d");
  const [showArchived, setShowArchived] = useState(false);
  const [sort, setSort] = useState("name_asc");

  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [activeModalClientId, setActiveModalClientId] = useState<number | null>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [overviewEvents, setOverviewEvents] = useState<DeliveryDetail[]>([]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search: debouncedSearch,
        range,
        showArchived: String(showArchived),
        sort,
      });
      const res = await fetch(`/api/dashboard?${query.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load dashboard statistics");
      }
      const payload = await res.json();
      setData(payload);
      setError("");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [debouncedSearch, range, showArchived, sort]);

  // Fetch Delivery Overview data from already-loaded dashboard
  const handleOpenOverview = () => {
    if (!data) return;
    setIsOverviewOpen(true);
    const events: DeliveryDetail[] = [];
    data.clients.forEach(c => {
      events.push(...c.deliveries);
    });
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setOverviewEvents(events);
  };

  const handleEditClient = (id: number) => {
    setActiveModalClientId(id);
  };

  const handleCloseModal = () => {
    setActiveModalClientId(null);
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageInfo}>
          <h1 className={styles.title + " text-gradient"}>Dashboard</h1>
          <p className={styles.subtitle}>Overview of all website traffic</p>
        </div>

        {/* Delivery Overview Card/Button */}
        <button className={styles.overviewCard} onClick={handleOpenOverview}>
          <div className={styles.overviewIcon}>
            <Layers size={20} />
          </div>
          <div className={styles.overviewText}>
            <span className={styles.overviewTitle}>Delivery Overview</span>
            <span className={styles.overviewDesc}>Links, content, traffic and rank movement per client</span>
          </div>
        </button>
      </div>

      {/* Main stats loader */}
      {error && (
        <div className={styles.errorState}>
          <AlertTriangle size={24} style={{ color: "var(--error)" }} />
          <span className={styles.stateTitle}>Failed to Load Dashboard</span>
          <p className={styles.stateDesc}>{error}</p>
          <button onClick={fetchDashboardData} className={styles.btnRetry}>
            Retry Load
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* KPI Summary (use cached data if loading, or skeleton) */}
          {data ? (
            <KPICards portfolio={data.portfolio} />
          ) : (
            <div style={{ height: "130px", background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="spinner" />
            </div>
          )}

          {/* Controls Panel */}
          <DashboardControls
            search={search}
            setSearch={setSearch}
            range={range}
            setRange={setRange}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            sort={sort}
            setSort={setSort}
          />

          {/* CLIENT SITES title & counts */}
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <h2 className={styles.sectionTitle}>Client Sites</h2>
              <span className={styles.countBadge}>
                {data ? (
                  debouncedSearch
                    ? `Showing ${data.clients.length} of ${data.totalClientsCount} clients`
                    : `${data.totalClientsCount} clients`
                ) : "Calculating..."}
              </span>
            </div>
          </div>

          {/* Loading spinner overlay */}
          {loading && !data && (
            <div className={styles.loadingWrapper}>
              <div className="spinner" />
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Refreshing statistics...</span>
            </div>
          )}

          {/* Loading overlay fade for refetch */}
          <div style={{ opacity: loading && data ? 0.6 : 1, transition: "opacity 0.2s ease" }}>

          {/* Empty States / Grid */}
          {data && (
            <>
              {data.clients.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.stateTitle}>No Clients Found</span>
                  <p className={styles.stateDesc}>
                    {search 
                      ? `No active clients matching "${search}" were found. Try checking archived accounts.` 
                      : "Your portfolio is currently empty. Get started by adding a website in clients management."
                    }
                  </p>
                </div>
              ) : (
                <div className={styles.clientsGrid}>
                  {data.clients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onEdit={handleEditClient}
                      onView={handleEditClient}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          </div>
        </>
      )}

      {/* Edit Client Modal */}
      {activeModalClientId !== null && (
        <ClientModal
          clientId={activeModalClientId}
          isOpen={activeModalClientId !== null}
          onClose={handleCloseModal}
          onSuccess={fetchDashboardData}
        />
      )}

      {/* Delivery Overview Modal */}
      {isOverviewOpen && (
        <div className={modalStyles.overlay} onClick={() => setIsOverviewOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>Delivery Overview (All Clients)</span>
              <button onClick={() => setIsOverviewOpen(false)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <div className={modalStyles.body}>
              {overviewEvents.length === 0 ? (
                <div className={modalStyles.noEvents}>No recent deliveries found in the selected date range.</div>
              ) : (
                <div className={modalStyles.timeline}>
                  {overviewEvents.map((event, idx) => {
                    const isLink = event.type === "BACKLINK";
                    return (
                      <div key={idx} className={modalStyles.timelineItem}>
                        <div className={`${modalStyles.timelineDot} ${isLink ? modalStyles.backlink : modalStyles.content}`} />
                        <div className={modalStyles.timelineHeader}>
                          <span className={modalStyles.timelineDate}>
                            {new Date(event.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--text-primary)" }}>
                            {event.clientName}
                          </span>
                          <span className={`${modalStyles.timelineType} ${isLink ? modalStyles.backlink : modalStyles.content}`}>
                            {event.type}
                          </span>
                        </div>
                        <div className={modalStyles.timelineDesc}>{event.description}</div>
                        {isLink && event.linkDetails && (
                          <div className={modalStyles.timelineDetailsCard}>
                            <div className={modalStyles.timelineDetailsRow}>
                              <span>Target Link Placement:</span>
                              <a href={event.linkDetails.url} target="_blank" rel="noopener noreferrer" className={modalStyles.timelineLink}>
                                {event.linkDetails.url.slice(0, 45)}...
                              </a>
                            </div>
                            <div className={modalStyles.timelineDetailsRow}>
                              <span>Anchor:</span>
                              <span className={modalStyles.timelineValue}>"{event.linkDetails.anchorText}"</span>
                            </div>
                            <div className={modalStyles.timelineDetailsRow}>
                              <span>Authority:</span>
                              <span className={modalStyles.timelineValue}>{event.linkDetails.domainAuthority} DA</span>
                            </div>
                          </div>
                        )}
                        {!isLink && event.contentDetails && (
                          <div className={modalStyles.timelineDetailsCard}>
                            <div className={modalStyles.timelineDetailsRow}>
                              <span>Published Post:</span>
                              <a href={event.contentDetails.url} target="_blank" rel="noopener noreferrer" className={modalStyles.timelineLink}>
                                {event.contentDetails.url.slice(0, 45)}...
                              </a>
                            </div>
                            <div className={modalStyles.timelineDetailsRow}>
                              <span>Title:</span>
                              <span className={modalStyles.timelineValue}>"{event.contentDetails.title}"</span>
                            </div>
                            <div className={modalStyles.timelineDetailsRow}>
                              <span>Length:</span>
                              <span className={modalStyles.timelineValue}>{event.contentDetails.wordCount} words</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className={modalStyles.footer}>
              <button onClick={() => setIsOverviewOpen(false)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
