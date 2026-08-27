"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";
import { handleApiError } from "@/lib/apiUtils";
import { useToast } from "@/components/ToastContext";

interface Property {
  id: string;
  domain: string;
  name: string;
  clientId: string;
  client: { id: string; name: string };
  brandType: string;
  brandKeywords: string | null;
}

interface Client {
  id: string;
  name: string;
}

export default function GscSettingsPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  
  // Track changes made in the UI before saving
  const [updates, setUpdates] = useState<Record<string, Partial<Property>>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/gsc/settings");
        if (!res.ok) throw new Error("Failed to load GSC settings");
        const json = await res.json();
        setProperties(json.properties || []);
        setClients(json.clients || []);
      } catch (err: unknown) {
        handleApiError(err, { 
          toast: { error: toastError },
          fallbackMessage: "Failed to load GSC settings"
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [toastError]);

  const handleUpdate = (id: string, field: keyof Property, value: Property[keyof Property]) => {
    setUpdates(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredProperties.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleSave = async () => {
    if (Object.keys(updates).length === 0) return;
    
    setSaving(true);
    try {
      const payload = Object.entries(updates).map(([id, changes]) => {
        const original = properties.find(p => p.id === id)!;
        return {
          id,
          clientId: changes.clientId !== undefined ? changes.clientId : original.clientId,
          brandType: changes.brandType !== undefined ? changes.brandType : original.brandType,
          brandKeywords: changes.brandKeywords !== undefined ? changes.brandKeywords : original.brandKeywords,
        };
      });

      const res = await fetch("/api/gsc/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyUpdates: payload }),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      
      toastSuccess("Settings saved successfully");
      
      // Merge updates into properties
      setProperties(prev => prev.map(p => {
        if (updates[p.id]) {
          return { ...p, ...updates[p.id] };
        }
        return p;
      }));
      setUpdates({});
    } catch (err: unknown) {
      const errObj = err as Error;
      handleApiError(err, { 
        toast: { error: toastError },
        fallbackMessage: "Failed to save settings"
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredProperties = properties.filter(p => 
    p.domain.toLowerCase().includes(search.toLowerCase()) || 
    p.client?.name.toLowerCase().includes(search.toLowerCase())
  );

  const hasChanges = Object.keys(updates).length > 0;

  return (
    <div className={styles.container} style={{ padding: "32px", maxWidth: "1600px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      
      <div style={{ marginBottom: "16px" }}>
        <Link href="/admin/gsc" style={{ color: "#64748B", fontSize: "13px", textDecoration: "none", marginBottom: "8px", display: "inline-block" }}>
          &larr; GSC Intelligence
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 className={styles.title} style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: 0 }}>GSC Settings</h1>
          <Link href="/admin/gsc" style={{ fontSize: "13px", padding: "6px 14px", background: "white", border: "1px solid #CBD5E1", borderRadius: "6px", textDecoration: "none", color: "#334155", fontWeight: "600" }}>
            Back to Overview
          </Link>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0" }}>GSC Properties</h2>
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>Shows status and allows GSC to be synced. Select a client to assign a property.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={!hasChanges || saving}
            style={{ 
              background: "#0F4C5C", 
              color: "white", 
              border: "none", 
              padding: "7px 16px", 
              borderRadius: "6px", 
              fontSize: "13px", 
              fontWeight: "700", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            {saving && <Loader2 size={14} className="spin" />}
            Save Settings
          </button>
        </div>

        <div style={{ position: "relative", maxWidth: "400px", marginBottom: "20px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "10px", color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Search by domain or client name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px" }}
          />
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
            <PageLoader message="Loading..." showSkeleton />
          </div>
        ) : (
          <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "12px 16px", width: "40px" }}>
                    <input 
                      type="checkbox" 
                      onChange={e => handleSelectAll(e.target.checked)}
                      checked={filteredProperties.length > 0 && selectedIds.size === filteredProperties.length}
                    />
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: "700" }}>PROPERTY URL</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", width: "20%" }}>DOMAIN OVERRIDE</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", width: "20%" }}>CLIENT ASSIGNMENT</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", width: "25%" }}>NON-BRANDED REGEX</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", width: "70px", textAlign: "center" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#94A3B8" }}>No properties found</td>
                  </tr>
                ) : (
                  filteredProperties.map(property => {
                    const currentValues = updates[property.id] || {};
                    const clientId = currentValues.clientId !== undefined ? currentValues.clientId : property.clientId;
                    const brandKeywords = currentValues.brandKeywords !== undefined ? currentValues.brandKeywords : (property.brandKeywords || "");
                    const isSelected = selectedIds.has(property.id);

                    return (
                      <tr key={property.id} style={{ borderTop: "1px solid #F1F5F9", background: isSelected ? "#F0FDF4" : "white" }}>
                        <td style={{ padding: "10px 16px" }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={e => handleSelect(property.id, e.target.checked)}
                          />
                        </td>
                        <td style={{ padding: "10px 16px", color: "#0F172A", fontWeight: "500" }}>
                          https://{property.domain}/
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <input 
                            type="text" 
                            placeholder="Enter domain override..."
                            style={{ width: "100%", padding: "5px 8px", border: "1px solid #E2E8F0", borderRadius: "4px", fontSize: "12px" }}
                          />
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <select 
                            value={clientId || ""}
                            onChange={e => handleUpdate(property.id, "clientId", e.target.value)}
                            style={{ width: "100%", padding: "5px 8px", border: "1px solid #E2E8F0", borderRadius: "4px", fontSize: "12px", background: "white", color: "#334155" }}
                          >
                            <option value="" disabled>Select a client...</option>
                            {clients.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <input 
                            type="text" 
                            value={brandKeywords || ""}
                            onChange={e => handleUpdate(property.id, "brandKeywords", e.target.value)}
                            placeholder="eg. (brandname|brand name)"
                            style={{ width: "100%", padding: "5px 8px", border: "1px solid #E2E8F0", borderRadius: "4px", fontSize: "12px" }}
                          />
                        </td>
                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                          <Link 
                            href={`/admin/gsc/${property.id}`}
                            style={{ color: "#64748B", textDecoration: "none", fontSize: "11px", fontWeight: "600", border: "1px solid #CBD5E1", padding: "3px 8px", borderRadius: "4px" }}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
