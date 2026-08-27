"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import PageLoader from "@/components/PageLoader";

interface PieceReview {
  id: string;
  title: string;
  words: number;
  approvedDate: string;
  isLive: boolean;
}

export default function CustomerContentPreviewPage() {
  const router = useRouter();
  const rawParams = useParams();
  const clientId = (rawParams?.clientId as string) || "";

  const [clientName, setClientName] = useState("Client");
  const [pieces, setPieces] = useState<PieceReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientContent = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const clientRes = await fetch(`/api/clients/${clientId}`);
      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClientName(clientData.name || "Client");
        
        const propertyId = clientData.properties?.[0]?.id;
        if (propertyId) {
          const itemsRes = await fetch(`/api/content/items?propertyId=${propertyId}`);
          if (itemsRes.ok) {
            const itemsData = await itemsRes.json();
            const formatted = (itemsData.items || []).map((item: any) => ({
              id: item.id,
              title: item.title,
              words: item.draft?.wordCount || 1200,
              approvedDate: new Date(item.updatedAt || item.createdAt).toISOString().split("T")[0],
              isLive: item.status === "PUBLISHED" || item.status === "APPROVED"
            }));
            setPieces(formatted);
          }
        }
      }
    } catch (err) {
      console.error("Preview fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClientContent();
  }, [fetchClientContent]);

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh" }}>
      {/* 1. TOP DARK TEAL BANNER */}
      <div style={{ background: "#0F4C5C", color: "#FFFFFF", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8125rem" }}>
        <div>
          <strong>Customer view</strong> — This is what {clientName} sees at /hub when they sign in. Read-only preview — nothing here is logged as a client visit.
        </div>
        <Link
          href={`/admin/content/${clientId}`}
          style={{ color: "#FFFFFF", textDecoration: "underline", fontWeight: "600", fontSize: "0.8125rem" }}
        >
          ← Back to pipeline
        </Link>
      </div>

      {/* 2. CLIENT SUBHEADER */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
          <img src="/logo.png" alt="Mister SK Infotech" style={{ height: "24px", width: "auto" }} />
          <span style={{ fontWeight: "800", fontSize: "1.1rem", color: "#0F172A" }}>Mister SK</span>
          <span style={{ fontSize: "0.75rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: "700", marginLeft: "6px" }}>YOUR CONTENT</span>
        </div>

        {/* 3. PAGE TITLE */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0" }}>
              Your content
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#64748B", margin: 0 }}>
              All approved articles written for your website. Click any title to read the full draft.
            </p>
          </div>
        </div>

        {/* 4. PIECES LIST */}
        {loading ? (
          <PageLoader message="Loading Content" subtitle="Fetching approved articles" />
        ) : pieces.length === 0 ? (
          <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "40px", textAlign: "center", color: "#64748B" }}>
            No approved content pieces available for {clientName} yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {pieces.map((piece) => (
              <div
                key={piece.id}
                style={{
                  background: "#FFFFFF",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  padding: "18px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#0F172A", margin: "0 0 6px 0" }}>
                    {piece.title}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.75rem", color: "#64748B" }}>
                    <span>{piece.words.toLocaleString()} words</span>
                    <span>Approved {piece.approvedDate}</span>
                  </div>
                </div>

                <div>
                  {piece.isLive && (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "#ECFDF5",
                      color: "#059669",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: "700"
                    }}>
                      <CheckCircle2 size={12} /> Live
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
