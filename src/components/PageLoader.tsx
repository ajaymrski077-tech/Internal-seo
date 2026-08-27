"use client";

import styles from "@/styles/PageLoader.module.css";

interface PageLoaderProps {
  /** Primary loading message, e.g. "Loading Content Library" */
  message?: string;
  /** Secondary hint underneath, e.g. "Fetching records from database" */
  subtitle?: string;
  /** Show a shimmer progress bar underneath */
  showProgress?: boolean;
  /** Show skeleton placeholder rows */
  showSkeleton?: boolean;
  /** Minimum height for the container (default: 320px) */
  minHeight?: number | string;
}

/**
 * A premium page-level loader with orbital ring animation,
 * pulsing core, shimmer bar, and trailing dots.
 *
 * Usage:
 *   <PageLoader message="Loading Rankings" subtitle="Syncing keyword data" />
 */
export default function PageLoader({
  message = "Loading",
  subtitle,
  showProgress = true,
  showSkeleton = false,
  minHeight = 320,
}: PageLoaderProps) {
  return (
    <div className={styles.loaderOverlay} style={{ minHeight }}>
      {/* Orbital spinner */}
      <div className={styles.orbitalContainer}>
        <div className={styles.orbitalRingOuter} />
        <div className={styles.orbitalRingMiddle} />
        <div className={styles.orbitalRingInner} />
        <div className={styles.orbitalCore} />
      </div>

      {/* Text */}
      <div className={styles.loaderTextGroup}>
        <div className={styles.loaderTitle}>{message}</div>
        <div className={styles.loaderSubtitle}>
          {subtitle || "Please wait"}
          <span className={styles.dotPulse}>
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>

      {/* Shimmer bar */}
      {showProgress && (
        <div className={styles.shimmerBar}>
          <div className={styles.shimmerBarFill} />
        </div>
      )}

      {/* Skeleton rows */}
      {showSkeleton && (
        <>
          <div className={styles.skeletonRow}>
            <div className={styles.skeletonBlock} style={{ width: "25%" }} />
            <div className={styles.skeletonBlock} style={{ width: "45%" }} />
            <div className={styles.skeletonBlock} style={{ width: "20%" }} />
          </div>
          <div className={styles.skeletonRow}>
            <div className={styles.skeletonBlock} style={{ width: "35%" }} />
            <div className={styles.skeletonBlock} style={{ width: "30%" }} />
            <div className={styles.skeletonBlock} style={{ width: "25%" }} />
          </div>
          <div className={styles.skeletonRow}>
            <div className={styles.skeletonBlock} style={{ width: "20%" }} />
            <div className={styles.skeletonBlock} style={{ width: "50%" }} />
            <div className={styles.skeletonBlock} style={{ width: "15%" }} />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * A small inline loader for use inside buttons or table cells.
 *
 * Usage:
 *   <InlineLoader text="Saving" />
 */
export function InlineLoader({ text = "Loading" }: { text?: string }) {
  return (
    <span className={styles.inlineLoader}>
      <span className={styles.inlineSpinner} />
      {text}
    </span>
  );
}
