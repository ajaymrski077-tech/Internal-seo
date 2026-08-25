"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import styles from "@/styles/ConfirmModal.module.css";
import { AlertCircle, X } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolvePromise?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolvePromise?.(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <div className={styles.overlay} onClick={handleCancel}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <div className={styles.titleArea}>
                {options.destructive && <AlertCircle size={20} className={styles.iconDestructive} />}
                <h3 className={styles.title}>{options.title || "Confirm Action"}</h3>
              </div>
              <button className={styles.closeBtn} onClick={handleCancel}><X size={16} /></button>
            </div>
            <div className={styles.body}>
              <p>{options.message}</p>
            </div>
            <div className={styles.footer}>
              <button className={styles.btnCancel} onClick={handleCancel}>
                {options.cancelText || "Cancel"}
              </button>
              <button 
                className={`${styles.btnConfirm} ${options.destructive ? styles.btnDestructive : ""}`} 
                onClick={handleConfirm}
              >
                {options.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
