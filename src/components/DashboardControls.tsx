"use client";

import { Search } from "lucide-react";
import styles from "@/styles/Dashboard.module.css";

interface DashboardControlsProps {
  search: string;
  setSearch: (s: string) => void;
  range: string;
  setRange: (r: string) => void;
  showArchived: boolean;
  setShowArchived: (b: boolean) => void;
  sort: string;
  setSort: (s: string) => void;
}

export default function DashboardControls({
  search,
  setSearch,
  range,
  setRange,
  showArchived,
  setShowArchived,
  sort,
  setSort,
}: DashboardControlsProps) {
  const dateRanges = [
    { code: "7d", label: "7 days" },
    { code: "30d", label: "30 days" },
    { code: "90d", label: "90 days" },
    { code: "1y", label: "Last year" },
  ];

  const sortingOptions = [
    { value: "name_asc", label: "Client Name A–Z" },
    { value: "name_desc", label: "Client Name Z–A" },
    { value: "traffic_desc", label: "Highest Traffic" },
    { value: "traffic_asc", label: "Lowest Traffic" },
    { value: "growth_desc", label: "Highest Growth" },
    { value: "growth_asc", label: "Lowest Growth" },
  ];

  return (
    <div className={styles.controlsContainer}>
      {/* Left side: Search & Date Filters */}
      <div className={styles.controlsLeft}>
        {/* Search */}
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by client or website..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date Filters */}
        <div className={styles.dateFilters}>
          {dateRanges.map((r) => (
            <button
              key={r.code}
              type="button"
              className={`${styles.filterBtn} ${
                range === r.code ? styles.filterBtnActive : ""
              }`}
              onClick={() => setRange(r.code)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right side: Archived toggle & Sorting */}
      <div className={styles.controlsRight}>
        {/* Show Archived Toggle */}
        <label className={styles.archivedLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          <span>Show Archived</span>
        </label>

        {/* Sorting Dropdown */}
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {sortingOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
