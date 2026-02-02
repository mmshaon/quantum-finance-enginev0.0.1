"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@utils/index";

interface LedgerEntry {
  id: string;
  type: "DEBIT" | "CREDIT" | string;
  amount: number;
  reference: string | null;
  createdAt: string;
}

interface StaffFinancialResponse {
  success: boolean;
  staff: { id: string; name: string; email?: string | null; position?: string | null };
  balance: number;
  ledger: LedgerEntry[];
}

export default function StaffFinancialPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<StaffFinancialResponse | null>(null);
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
      const res = await apiRequest<StaffFinancialResponse>(
        `/staff/${params.id}/financial`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res);
    } catch (e: any) {
      setError(e.message || "Failed to load staff financial profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, token]);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-xs opacity-70">Loading staff financial profile...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-xs text-red-400 mb-4">{error || "Not found"}</p>
        <button
          onClick={() => router.back()}
          className="px-3 py-1 rounded-full border border-cyanGlow/60 text-xs"
        >
          Back
        </button>
      </main>
    );
  }

  const { staff, balance, ledger } = data;

  return (
    <main className="min-h-screen p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Staff Financial Profile</h1>
          <p className="text-sm opacity-80">
            {staff.name} ({staff.email}){staff.position ? ` — ${staff.position}` : ""}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-3 py-1 rounded-full border border-cyanGlow/60 text-xs"
        >
          Back
        </button>
      </div>

      <div className="card flex justify-between items-center">
        <div>
          <div className="text-xs opacity-70">Current Balance</div>
          <div className="text-2xl font-bold">{balance.toFixed(2)} SAR</div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs ${
            balance > 0
              ? "bg-emerald-900/40 text-emerald-300"
              : balance < 0
              ? "bg-red-900/40 text-red-300"
              : "bg-cyanDeep/40 text-cyanGlow"
          }`}
        >
          {balance > 0
            ? "Company owes staff"
            : balance < 0
            ? "Staff owes company"
            : "Settled"}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Ledger Entries</h2>
        {ledger.length === 0 && <p className="text-xs opacity-70">No ledger entries yet.</p>}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {ledger.map((entry) => (
            <div
              key={entry.id}
              className="border border-cyanGlow/40 rounded-lg p-3 bg-black/40 flex justify-between items-center"
            >
              <div>
                <div className="text-xs opacity-70">
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
                <div className="text-sm">{entry.reference || "No reference"}</div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-semibold ${
                    entry.type === "DEBIT" ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {entry.type === "DEBIT" ? "+" : "-"}
                  {entry.amount.toFixed(2)} SAR
                </div>
                <div className="text-[11px] opacity-70">{entry.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
