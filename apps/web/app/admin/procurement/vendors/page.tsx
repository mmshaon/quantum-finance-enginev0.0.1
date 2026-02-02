"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@utils/index";

interface Vendor {
  id: string;
  name: string;
  code: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("qfe-token") || sessionStorage.getItem("qfe-token")
      : null;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; vendors: Vendor[] }>(
        "/vendors",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVendors(res.vendors);
    } catch (e: any) {
      setError(e.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <main className="min-h-screen p-6 space-y-6">
      <h1 className="text-2xl font-bold">Vendors</h1>
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Vendor List</h2>
        {loading && <p className="text-xs opacity-70">Loading...</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="space-y-2">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="border border-cyanGlow/40 rounded-lg p-3 bg-black/40 flex justify-between items-center"
            >
              <div>
                <div className="text-sm font-semibold">
                  {vendor.name} ({vendor.code})
                </div>
                <div className="text-xs opacity-70">{vendor.phone || vendor.email}</div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs ${
                  vendor.isActive ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"
                }`}
              >
                {vendor.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
