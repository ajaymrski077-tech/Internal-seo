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
        {/* Left Section: Logo & Links */}
        <div className={styles.leftSection}>
          <Link href="/admin" className={styles.logo} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img src="/logo.png" alt="MisterSK Infotech" style={{ height: "40px", width: "auto" }} />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className={styles.navList}>
          {navLinks.map((link) => {
            const isActive = link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
              >
                {link.name}
              </Link>
            );
          })}

          {/* Content Dropdown */}
          <div className={styles.dropdown}>
            <Link
              href="/admin/content"
              className={`${styles.navLink} ${styles.dropdownTrigger} ${pathname.startsWith("/admin/content") ? styles.active : ""}`}
              style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
            >
              Content <ChevronDown size={14} style={{ marginLeft: "4px" }} />
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

          <div className={styles.dropdown}>
            <button className={`${styles.navLink} ${styles.dropdownTrigger}`} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
              SEO Tools <ChevronDown size={14} style={{ marginLeft: "4px" }} />
            </button>
            <div className={styles.dropdownMenu}>
              {otherLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.dropdownItem}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Right Section: Controls & Avatar */}
        <div className={styles.rightSection}>
          {/* Notifications */}
          <div className={styles.notificationMenu}>
            <button className={styles.controlBtn} aria-label="Notifications" onMouseEnter={fetchNotifications} onFocus={fetchNotifications}>
              <Bell size={18} />
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
          <button className={styles.controlBtn} aria-label="Settings" title="Settings (coming soon)">
            <Settings size={18} />
          </button>

          {/* User Menu */}
          <div className={styles.userMenu}>
            <button className={styles.userTrigger}>
              <div className={styles.avatar}>
                {getInitials(user?.name)}
              </div>
            </button>
            <div className={styles.userDropdown}>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user?.name || "Loading..."}</div>
                <div className={styles.userEmail}>{user?.email || "loading@mistersk.com"}</div>
              </div>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>

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
