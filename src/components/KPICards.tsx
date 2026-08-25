"use client";

import { Eye, Search, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import styles from "@/styles/KPICard.module.css";
import { MetricDelta } from "@/services/analyticsService";

interface KPICardsProps {
  portfolio: MetricDelta;
}

export default function KPICards({ portfolio }: KPICardsProps) {
  // Format numbers (e.g. 123456 -> 123.5k or similar, or just comma format)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const cards = [
    {
      title: "Total Sessions",
      value: formatNumber(portfolio.sessions),
      change: portfolio.sessionsChange,
      icon: Eye,
      period: "vs previous equivalent period",
    },
    {
      title: "Organic Traffic",
      value: formatNumber(portfolio.organicTraffic),
      change: portfolio.organicTrafficChange,
      icon: Search,
      period: "vs previous equivalent period",
    },
    {
      title: "Total Conversions",
      value: formatNumber(portfolio.conversions),
      change: portfolio.conversionsChange,
      icon: Target,
      period: "vs previous equivalent period",
    },
  ];

  return (
    <div className={styles.kpiGrid}>
      {cards.map((card, i) => {
        const Icon = card.icon;
        const isPositive = card.change >= 0;

        return (
          <div key={i} className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>{card.title}</span>
              <div className={styles.kpiIconWrapper}>
                <Icon size={20} />
              </div>
            </div>

            <div className={styles.kpiValue}>{card.value}</div>

            <div className={styles.kpiFooter}>
              <div
                className={`${styles.trendBadge} ${
                  isPositive ? styles.positive : styles.negative
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}
                <span>{isPositive ? "+" : ""}{card.change}%</span>
              </div>
              <span className={styles.trendPeriod}>{card.period}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
