"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@utils/index";

interface VendorEntry {
  type: "invoice" | "payment";
  amount: number;
  date: string;
  ref: string;
}

interface VendorLedger {
  vendorId: string;
  vendorName: string;
  balance: number;
  entries: VendorEntry[];
}

export default function VendorLedgerPage() {
  const [ledger, setLedger] = useState<VendorLedger[]>([]);
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
      const res = await apiRequest<{ success: boolean; ledger: VendorLedger[] }>(
        "/vendor-ledger",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLedger(res.ledger);
    } catch (e: any) {
      setError(e.message || "Failed to load vendor ledger");
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
      <h1 className="text-2xl font-bold">Vendor Ledger</h1>
      <div className="card">
        {loading && <p className="text-xs opacity-70">Loading...</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="space-y-4">
          {ledger.map((vendor) => (
            <div key={vendor.vendorId} className="border border-cyanGlow/40 rounded-lg p-4 bg-black/40">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-semibold">{vendor.vendorName}</div>
                  <div className="text-xs opacity-70">Balance: {vendor.balance.toFixed(2)} SAR</div>
                </div>
              </div>
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-2 text-xs">
                {vendor.entries.map((entry, idx) => (
                  <div key={`${vendor.vendorId}-${idx}`} className="flex justify-between">
                    <div>
                      {entry.type === "invoice" ? "Invoice" : "Payment"} - {entry.ref}
                    </div>
                    <div className="text-right">
                      {entry.type === "invoice" ? "+" : "-"}
                      {entry.amount.toFixed(2)} SAR
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
