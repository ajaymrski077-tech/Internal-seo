"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Settings,
  ChevronDown,
  LogOut,
  Menu,
  X
} from "lucide-react";
import styles from "@/styles/Header.module.css";
import { useToast } from "@/components/ToastContext";
import { handleApiError } from "@/lib/apiUtils";

interface UserSession {
  id: number;
  email: string;
  name: string;
}

interface ActivityLogItem {
  id: string | number;
  action: string;
  clientName?: string;
  createdAt: string;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { error: toastError } = useToast();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<ActivityLogItem[]>([]);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);

  // Fetch current user details on load
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error("Session check failed", error);
      }
    }
    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth", { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Server returned an error during logout.");
      }
      router.push("/login");
      router.refresh();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Logout failed. Please try again." });
    }
  };

  const navLinks = [
    { name: "Dashboard", href: "/admin" },
    { name: "Clients", href: "/admin/clients" },
    { name: "Reports", href: "/admin/reports" },
  ];

  const contentLinks = [
    { name: "Content Hub", href: "/admin/content", icon: "🌐" },
    { name: "Ideas", href: "/admin/content/ideas", icon: "💡" },
    { name: "Drafts", href: "/admin/content/drafts", icon: "✏️" },
    { name: "Editing queue", href: "/admin/content/editing-queue", icon: "📋" },
    { name: "Content Library", href: "/admin/content/library", icon: "📑" },
    { name: "Content Gap Analysis", href: "/admin/content/gap-analysis", icon: "⚡" },
  ];

  const otherLinks = [
    { name: "Tickets", href: "/admin/tickets" },
    { name: "GSC", href: "/admin/gsc" },
    { name: "On-Page", href: "/admin/onpage" },
    { name: "Rankings", href: "/admin/rankings" },
    { name: "Links", href: "/admin/links" },
    { name: "PR", href: "/admin/pr" },
    { name: "GBP", href: "/admin/gbp" },
    { name: "Ops", href: "/admin/ops" },
  ];

  const fetchNotifications = useCallback(async () => {
    if (notificationsLoaded) return;
    try {
      const res = await fetch("/api/activity-logs?limit=8");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.logs || []);
      }
    } catch (err: unknown) {
      // Silent toward user — notification bell just stays empty
      handleApiError(err, { toast: { error: () => { } }, fallbackMessage: "Failed to load notifications" });
    } finally {
      setNotificationsLoaded(true);
    }
  }, [notificationsLoaded]);



  // Get User Initials
  const getInitials = (name?: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className={styles.header}>
      <div className={styles.navContainer}>
        {/* Left Section: Logo */}
        <div className={styles.leftSection}>
          <Link href="/admin" className={styles.logo} style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <img src="/logo.png" alt="Mister SK Infotech" style={{ height: "26px", width: "auto", objectFit: "contain" }} />
            <span style={{ fontSize: "15px", fontWeight: "800", color: "#0F172A", letterSpacing: "-0.3px" }}>Mister SK</span>
          </Link>
        </div>

        {/* Center Desktop Navigation */}
        <nav className={styles.navList}>
          {/* 1. Dashboard */}
          <Link
            href="/admin"
            className={`${styles.navLink} ${pathname === "/admin" ? styles.activePill : ""}`}
          >
            Dashboard
          </Link>

          {/* 2. Clients */}
          <Link
            href="/admin/clients"
            className={`${styles.navLink} ${pathname.startsWith("/admin/clients") ? styles.activePill : ""}`}
          >
            Clients
          </Link>

          {/* 3. Reports */}
          <Link
            href="/admin/reports"
            className={`${styles.navLink} ${pathname.startsWith("/admin/reports") ? styles.activePill : ""}`}
          >
            Reports
          </Link>

          {/* 4. Content ▾ Dropdown */}
          <div className={styles.dropdown}>
            <Link
              href="/admin/content"
              className={`${styles.navLink} ${styles.dropdownTrigger} ${pathname.startsWith("/admin/content") ? styles.activePill : ""}`}
            >
              Content <ChevronDown size={13} style={{ marginLeft: "2px" }} />
            </Link>
            <div className={styles.dropdownMenu}>
              {contentLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.dropdownItem}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ fontSize: "0.9rem" }}>{link.icon}</span>
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* 5. Tickets */}
          <Link
            href="/admin/tickets"
            className={`${styles.navLink} ${pathname.startsWith("/admin/tickets") ? styles.activePill : ""}`}
          >
            Tickets
          </Link>

          {/* 6. GSC (highlighted pill) */}
          <Link
            href="/admin/gsc"
            className={`${styles.navLink} ${pathname.startsWith("/admin/gsc") ? styles.activePill : ""}`}
          >
            GSC
          </Link>

          {/* 7. On-Page ▾ */}
          <div className={styles.dropdown}>
            <Link
              href="/admin/onpage"
              className={`${styles.navLink} ${styles.dropdownTrigger} ${pathname.startsWith("/admin/onpage") ? styles.activePill : ""}`}
            >
              On-Page <ChevronDown size={13} style={{ marginLeft: "2px" }} />
            </Link>
            <div className={styles.dropdownMenu}>
              <Link href="/admin/onpage" className={styles.dropdownItem}>On-Page Tools</Link>
              <Link href="/admin/onpage/audits" className={styles.dropdownItem}>On-Page Audits</Link>
              <Link href="/admin/onpage/mapping" className={styles.dropdownItem}>Keyword Mapping</Link>
              <Link href="/admin/onpage/meta" className={styles.dropdownItem}>Meta Generator</Link>
              <Link href="/admin/onpage/opportunities" className={styles.dropdownItem}>Opportunity Worklist</Link>
            </div>
          </div>

          {/* 8. Rankings ▾ */}
          <div className={styles.dropdown}>
            <Link
              href="/admin/rankings"
              className={`${styles.navLink} ${styles.dropdownTrigger} ${pathname.startsWith("/admin/rankings") ? styles.activePill : ""}`}
            >
              Rankings <ChevronDown size={13} style={{ marginLeft: "2px" }} />
            </Link>
            <div className={styles.dropdownMenu}>
              <Link href="/admin/rankings" className={styles.dropdownItem}>Rankings Overview</Link>
            </div>
          </div>

          {/* 9. Links ▾ */}
          <div className={styles.dropdown}>
            <Link
              href="/admin/links"
              className={`${styles.navLink} ${styles.dropdownTrigger} ${pathname.startsWith("/admin/links") ? styles.activePill : ""}`}
            >
              Links <ChevronDown size={13} style={{ marginLeft: "2px" }} />
            </Link>
            <div className={styles.dropdownMenu}>
              <Link href="/admin/links" className={styles.dropdownItem}>Link Building Hub</Link>
              <Link href="/admin/links/analysis" className={styles.dropdownItem}>Backlink Analysis</Link>
              <Link href="/admin/links/prospects" className={styles.dropdownItem}>Prospect Pipeline</Link>
              <Link href="/admin/links/queue" className={styles.dropdownItem}>Action Queue</Link>
              <Link href="/admin/links/competitors" className={styles.dropdownItem}>Competitor Tracking</Link>
              <Link href="/admin/links/nap" className={styles.dropdownItem}>NAP Checker</Link>
              <Link href="/admin/links/content" className={styles.dropdownItem}>Content Scoring</Link>
              <Link href="/admin/links/campaigns" className={styles.dropdownItem}>Campaigns Directory</Link>
              <Link href="/admin/links/va-queue" className={styles.dropdownItem}>VA Contact Queue</Link>
              <Link href="/admin/links/replies" className={styles.dropdownItem}>Reply Inbox</Link>
              <Link href="/admin/links/tracker" className={styles.dropdownItem}>Link Tracker</Link>
              <Link href="/admin/links/settings" className={styles.dropdownItem}>Settings</Link>
            </div>
          </div>

          {/* 10. PR ▾ */}
          <div className={styles.dropdown}>
            <Link
              href="/admin/pr"
              className={`${styles.navLink} ${styles.dropdownTrigger} ${pathname.startsWith("/admin/pr") ? styles.activePill : ""}`}
            >
              PR <ChevronDown size={13} style={{ marginLeft: "2px" }} />
            </Link>
            <div className={styles.dropdownMenu}>
              <Link href="/admin/pr" className={styles.dropdownItem}>PR Pipeline</Link>
              <Link href="/admin/pr/calendar" className={styles.dropdownItem}>Calendar &amp; Intake</Link>
              <Link href="/admin/pr/requests" className={styles.dropdownItem}>Journalist Requests</Link>
              <Link href="/admin/pr/opportunities" className={styles.dropdownItem}>Asset Opportunities</Link>
              <Link href="/admin/pr/results" className={styles.dropdownItem}>PR Results</Link>
              <Link href="/admin/pr/national-dates" className={styles.dropdownItem}>National Dates</Link>
              <Link href="/admin/pr/verticals" className={styles.dropdownItem}>Verticals</Link>
              <Link href="/admin/pr/clients" className={styles.dropdownItem}>PR Clients</Link>
              <Link href="/admin/pr/settings" className={styles.dropdownItem}>PR Settings</Link>
            </div>
          </div>

          {/* 11. GBP */}
          <Link
            href="/admin/gbp"
            className={`${styles.navLink} ${pathname.startsWith("/admin/gbp") ? styles.activePill : ""}`}
          >
            GBP
          </Link>

          {/* 12. Ops ▾ */}
          <div className={styles.dropdown}>
            <Link
              href="/admin/ops"
              className={`${styles.navLink} ${styles.dropdownTrigger} ${pathname.startsWith("/admin/ops") ? styles.activePill : ""}`}
            >
              Ops <ChevronDown size={13} style={{ marginLeft: "2px" }} />
            </Link>
            <div className={styles.dropdownMenu}>
              <Link href="/admin/ops" className={styles.dropdownItem}>Operations Dashboard</Link>
              <Link href="/admin/ops/errors" className={styles.dropdownItem}>App Errors</Link>
              <Link href="/admin/ops/email-health" className={styles.dropdownItem}>Email Health</Link>
            </div>
          </div>
        </nav>

        {/* Right Section: Bell, Cog, Divider, Logout */}
        <div className={styles.rightSection}>
          {/* Notifications */}
          <div className={styles.notificationMenu}>
            <button className={styles.iconBtn} aria-label="Notifications" onMouseEnter={fetchNotifications} onFocus={fetchNotifications}>
              <Bell size={18} color="#475569" strokeWidth={1.8} />
              {notifications.length > 0 && <div className={styles.notificationBadge} />}
            </button>

            <div className={styles.notificationsPanel}>
              <div className={styles.notificationHeader}>Recent Activity</div>
              <div className={styles.notificationList}>
                {!notificationsLoaded ? (
                  <div className={styles.notificationItem} style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className={styles.notificationItem} style={{ textAlign: "center", color: "var(--text-muted)" }}>No recent activity.</div>
                ) : (
                  notifications.map((log) => {
                    const isConnect = log.action.toLowerCase().includes("connect");
                    const isArchive = log.action.toLowerCase().includes("archive");
                    const dotColor = isConnect ? "#3B82F6" : isArchive ? "#EF4444" : "#94A3B8";
                    return (
                      <div key={log.id} className={styles.notificationItem} style={{ display: "flex", gap: "8px", alignItems: "flex-start", textAlign: "left" }}>
                        <div style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: dotColor,
                          marginTop: "6px",
                          flexShrink: 0
                        }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-primary)", lineHeight: "1.3" }}>
                            <strong>{log.clientName || "System"}</strong>: {log.action.replace(/_/g, " ").toLowerCase()}
                          </span>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                            {new Date(log.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Settings */}
          <Link href="/admin/gsc/settings" className={styles.iconBtn} aria-label="Settings" title="Settings">
            <Settings size={18} color="#475569" strokeWidth={1.8} />
          </Link>

          {/* Vertical Separator */}
          <div style={{ width: "1px", height: "20px", background: "#E2E8F0", margin: "0 2px" }} />

          {/* Logout Button */}
          <button onClick={handleLogout} className={styles.logoutBtnBox}>
            Logout
          </button>

          {/* Mobile Toggle */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (optional overlay for tablets/mobiles) */}
      {isMobileMenuOpen && (
        <div className="glass" style={{
          position: "absolute",
          top: "70px",
          left: 0,
          right: 0,
          background: "var(--bg-panel-solid)",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          borderBottom: "1px solid var(--border-color)",
          zIndex: 99
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.active : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-color)", fontWeight: "bold", fontSize: "0.875rem" }}>Analytics Modules</div>
          {otherLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.active : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
