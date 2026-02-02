"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@utils/index";

interface PettyIssue {
  id: string;
  staffName: string | null;
  amount: number;
  purpose: string;
  status: string;
  issuedBy: { fullName: string | null; email: string | null } | null;
  createdAt: string;
  balance: number;
}

export default function PettyCashPage() {
  const [issues, setIssues] = useState<PettyIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [staffId, setStaffId] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("qfe-token") || sessionStorage.getItem("qfe-token")
      : null;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; issues: PettyIssue[] }>(
        "/hr/petty-cash",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIssues(res.issues);
    } catch (e: any) {
      setError(e.message || "Failed to load petty cash");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      await apiRequest("/hr/petty-cash/issue", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          staffId: staffId || undefined,
          amount: Number(amount),
          purpose
        })
      });
      setStaffId("");
      setAmount("");
      setPurpose("");
      load();
    } catch (e: any) {
      setError(e.message || "Failed to issue petty cash");
    }
  };

  return (
    <main className="min-h-screen p-6 space-y-6">
      <h1 className="text-2xl font-bold">Petty Cash</h1>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Issue Petty Cash</h2>
        <form onSubmit={submit} className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs mb-1">Staff ID (optional)</label>
            <input
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs mb-1">Purpose</label>
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
            />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-cyanGlow text-black text-sm font-semibold"
            >
              Issue
            </button>
          </div>
        </form>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Petty Cash Issues</h2>
        {loading && <p className="text-xs opacity-70">Loading...</p>}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {issues.map((i) => (
            <div
              key={i.id}
              className="border border-cyanGlow/40 rounded-lg p-3 bg-black/40 flex justify-between items-center"
            >
              <div>
                <div className="text-sm font-semibold">{i.staffName || "General"}</div>
                <div className="text-xs opacity-80">
                  {i.purpose} — {new Date(i.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  {i.amount.toFixed(2)} SAR
                </div>
                <div className="text-xs opacity-80">Balance: {i.balance.toFixed(2)} SAR</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
