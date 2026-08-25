"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import styles from "@/styles/Toast.module.css";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const success = useCallback((message: string) => addToast(message, "success"), [addToast]);
  const error = useCallback((message: string) => addToast(message, "error"), [addToast]);
  const warning = useCallback((message: string) => addToast(message, "warning"), [addToast]);
  const info = useCallback((message: string) => addToast(message, "info"), [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      <div className={styles.toastContainer} aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRemoving(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isRemoving) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, 300); // Matches animation duration
      return () => clearTimeout(timer);
    }
  }, [isRemoving, onRemove, toast.id]);

  const handleClose = () => {
    setIsRemoving(true);
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success": return <CheckCircle2 size={18} />;
      case "error": return <AlertCircle size={18} />;
      case "warning": return <AlertTriangle size={18} />;
      case "info": return <Info size={18} />;
    }
  };

  return (
    <div className={`${styles.toast} ${styles[toast.type]} ${isRemoving ? styles.removing : ""}`} role="alert">
      <div className={styles.icon}>{getIcon()}</div>
      <div className={styles.content}>
        <span className={styles.message}>{toast.message}</span>
      </div>
      <button className={styles.closeButton} onClick={handleClose} aria-label="Close notification">
        <X size={16} />
      </button>
    </div>
  );
}
