"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/styles/Auth.module.css";
import { Eye, EyeOff, UserPlus, LogIn, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"signin" | "signup">("signup"); // default to signup since DB was wiped
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if we are already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.push("/admin");
          }
        }
      } catch (err) {
        console.error("Auth check failed", err);
      }
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError("Password must contain at least one uppercase letter.");
        return;
      }
      if (!/[a-z]/.test(password)) {
        setError("Password must contain at least one lowercase letter.");
        return;
      }
      if (!/\d/.test(password)) {
        setError("Password must contain at least one number.");
        return;
      }
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
        setError("Password must contain at least one special character (e.g. @, #, $, %, !).");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to create account.");
        }

        setSuccess("Account created successfully! Redirecting...");
        setTimeout(() => {
          const nextRoute = searchParams.get("from") || "/admin";
          router.push(nextRoute);
          router.refresh();
        }, 800);
      } else {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Invalid email or password.");
        }

        const nextRoute = searchParams.get("from") || "/admin";
        router.push(nextRoute);
        router.refresh();
      }
    } catch (err: unknown) {
      const errObj = err as Error;
      setError(errObj?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo} style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
            <img src="/logo.png" alt="MisterSK Infotech" style={{ height: "42px", width: "auto" }} />
          </div>
          <span className={styles.subtitle}>
            {mode === "signup" ? "Create your admin credentials" : "Enter your credentials to sign in"}
          </span>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === "signup" ? styles.tabBtnActive : ""}`}
            onClick={() => {
              setMode("signup");
              setError("");
              setSuccess("");
            }}
          >
            <UserPlus size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }} />
            Create Credentials
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === "signin" ? styles.tabBtnActive : ""}`}
            onClick={() => {
              setMode("signin");
              setError("");
              setSuccess("");
            }}
          >
            <LogIn size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }} />
            Sign In
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && (
          <div className={styles.success}>
            <CheckCircle2 size={16} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === "signup" && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Your Name</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ajay / Admin"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              placeholder="admin@mistersk.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
              <input
                type={showPassword ? "text" : "password"}
                className={styles.input}
                style={{ paddingRight: "40px", width: "100%" }}
                placeholder={mode === "signup" ? "At least 8 characters with symbols" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mode === "signup" && password.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", marginTop: "6px", fontSize: "0.725rem", background: "var(--bg-secondary)", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                <span style={{ color: password.length >= 8 ? "#10b981" : "#94a3b8", fontWeight: password.length >= 8 ? 600 : 400 }}>
                  {password.length >= 8 ? "✓" : "○"} 8+ characters
                </span>
                <span style={{ color: /[A-Z]/.test(password) ? "#10b981" : "#94a3b8", fontWeight: /[A-Z]/.test(password) ? 600 : 400 }}>
                  {/[A-Z]/.test(password) ? "✓" : "○"} Uppercase (A-Z)
                </span>
                <span style={{ color: /[a-z]/.test(password) ? "#10b981" : "#94a3b8", fontWeight: /[a-z]/.test(password) ? 600 : 400 }}>
                  {/[a-z]/.test(password) ? "✓" : "○"} Lowercase (a-z)
                </span>
                <span style={{ color: /\d/.test(password) ? "#10b981" : "#94a3b8", fontWeight: /\d/.test(password) ? 600 : 400 }}>
                  {/\d/.test(password) ? "✓" : "○"} Number (0-9)
                </span>
                <span style={{ color: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? "#10b981" : "#94a3b8", fontWeight: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? 600 : 400 }}>
                  {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? "✓" : "○"} Symbol (@#$!)
                </span>
              </div>
            )}
          </div>

          {mode === "signup" && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className={styles.input}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading
              ? mode === "signup"
                ? "Creating Account..."
                : "Signing In..."
              : mode === "signup"
              ? "Create Admin Account"
              : "Sign In"}
          </button>
        </form>

        <div className={styles.hint} style={{ textAlign: "center" }}>
          {mode === "signup" ? (
            <p className={styles.hintText}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setSuccess("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-color)",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Sign In
              </button>
            </p>
          ) : (
            <p className={styles.hintText}>
              Need to create your credentials?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setSuccess("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-color)",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Create Credentials
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#090a0f" }}>
          <div className="spinner" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
