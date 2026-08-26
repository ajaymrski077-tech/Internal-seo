"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";
import { handleApiError } from "@/lib/apiUtils";
import { useToast } from "@/components/ToastContext";

interface Property {
  id: number;
  domain: string;
  name: string;
  clientId: number;
  client: { id: number; name: string };
  brandType: string;
  brandKeywords: string | null;
}

interface Client {
  id: number;
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
  const [updates, setUpdates] = useState<Record<number, Partial<Property>>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/gsc/settings");
        if (!res.ok) throw new Error("Failed to load GSC settings");
        const json = await res.json();
        setProperties(json.properties || []);
        setClients(json.clients || []);
      } catch (err: unknown) {
      const errObj = err as Error;
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

  const handleUpdate = (id: number, field: keyof Property, value: Property[keyof Property]) => {
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

  const handleSelect = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleSave = async () => {
    if (Object.keys(updates).length === 0) return;
    
    setSaving(true);
    try {
      const payload = Object.entries(updates).map(([idStr, changes]) => {
        const id = parseInt(idStr, 10);
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
      
      <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "8px" }}>
        Admin / GSC / GSC Settings
      </div>

      <div className={styles.headerRow} style={{ marginBottom: "24px" }}>
        <div>
          <h1 className={styles.title} style={{ fontSize: "24px", fontWeight: "600", marginBottom: "4px" }}>GSC Settings</h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Map website properties to clients and define their branded keywords.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={!hasChanges || saving}
          style={{ 
            background: hasChanges ? "#0D9488" : "#94A3B8", 
            color: "white", 
            border: "none", 
            padding: "8px 16px", 
            borderRadius: "6px", 
            fontSize: "14px", 
            fontWeight: "500", 
            cursor: hasChanges && !saving ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {saving && <Loader2 size={14} className="spin" />}
          Save Changes
        </button>
      </div>

      <div style={{ position: "relative", maxWidth: "400px", marginBottom: "24px" }}>
        <Search size={16} style={{ position: "absolute", left: "12px", top: "10px", color: "#888" }} />
        <input
          type="text"
          placeholder="Search by domain or client name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "14px" }}
        />
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
          <Loader2 className="spin" size={32} color="#CBD5E1" />
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#F1F5F9", color: "#475569", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "12px 24px", width: "40px" }}>
                  <input 
                    type="checkbox" 
                    onChange={e => handleSelectAll(e.target.checked)}
                    checked={filteredProperties.length > 0 && selectedIds.size === filteredProperties.length}
                  />
                </th>
                <th style={{ padding: "12px 24px", fontWeight: "600" }}>Property Name</th>
                <th style={{ padding: "12px 24px", fontWeight: "600", width: "20%" }}>Assigned Brand</th>
                <th style={{ padding: "12px 24px", fontWeight: "600", width: "15%" }}>Brand Type</th>
                <th style={{ padding: "12px 24px", fontWeight: "600", width: "25%" }}>Brand Keywords</th>
                <th style={{ padding: "12px 24px", fontWeight: "600", width: "80px", textAlign: "center" }}>Action</th>
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
                  const brandType = currentValues.brandType !== undefined ? currentValues.brandType : property.brandType;
                  const brandKeywords = currentValues.brandKeywords !== undefined ? currentValues.brandKeywords : (property.brandKeywords || "");
                  const isSelected = selectedIds.has(property.id);

                  return (
                    <tr key={property.id} style={{ borderTop: "1px solid #F1F5F9", background: isSelected ? "#F0FDF4" : "white" }}>
                      <td style={{ padding: "12px 24px" }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={e => handleSelect(property.id, e.target.checked)}
                        />
                      </td>
                      <td style={{ padding: "12px 24px", color: "#0F172A" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "#3B82F6" }}>https://</span>
                          {property.domain}
                        </div>
                      </td>
                      <td style={{ padding: "12px 24px" }}>
                        <select 
                          value={clientId}
                          onChange={e => handleUpdate(property.id, "clientId", parseInt(e.target.value, 10))}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #E2E8F0", borderRadius: "4px", fontSize: "13px", background: "white" }}
                        >
                          <option value={0} disabled>Select a client...</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "12px 24px" }}>
                        <select 
                          value={brandType}
                          onChange={e => handleUpdate(property.id, "brandType", e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #E2E8F0", borderRadius: "4px", fontSize: "13px", background: "white" }}
                        >
                          <option value="All Sites">All Sites</option>
                          <option value="Branded">Branded</option>
                          <option value="Non-Branded">Non-Branded</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px 24px" }}>
                        <input 
                          type="text" 
                          value={brandKeywords || ""}
                          onChange={e => handleUpdate(property.id, "brandKeywords", e.target.value)}
                          placeholder="e.g. brand name, brandings"
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #E2E8F0", borderRadius: "4px", fontSize: "13px" }}
                        />
                      </td>
                      <td style={{ padding: "12px 24px", textAlign: "center" }}>
                        <Link 
                          href={`/admin/gsc/${property.id}`}
                          style={{ color: "#0D9488", textDecoration: "none", fontSize: "12px", fontWeight: "500", border: "1px solid #E2E8F0", padding: "4px 8px", borderRadius: "4px" }}
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
  );
}
