"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@utils/index";

interface PayrollLine {
  staff: { id: string; fullName: string; email: string };
  baseSalary: number;
  netPay: number;
}

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  totalNetPay: number;
  lines: PayrollLine[];
}

export default function PayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [runs, setRuns] = useState<PayrollRun[]>([]);
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
      const res = await apiRequest<{ success: boolean; runs: PayrollRun[] }>(
        "/payroll/runs",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRuns(res.runs);
    } catch (e: any) {
      setError(e.message || "Failed to load payroll runs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const createRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await apiRequest("/payroll/runs", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ month, year })
      });
      load();
    } catch (e: any) {
      setError(e.message || "Failed to create payroll run");
      setLoading(false);
    }
  };

  const exportWps = async (id: string) => {
    if (!token) return;
    const res = await fetch(`/payroll/runs/${id}/export`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll-${id}-wps.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payroll</h1>
        <form onSubmit={createRun} className="flex gap-2 items-end">
          <div>
            <label className="text-xs opacity-70">Month</label>
            <input
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-20 px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
            />
          </div>
          <div>
            <label className="text-xs opacity-70">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-cyanGlow text-black text-sm font-semibold"
          >
            Generate
          </button>
        </form>
      </div>

      <div className="card">
        {loading && <p className="text-xs opacity-70">Loading...</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="space-y-4">
          {runs.map((run) => (
            <div key={run.id} className="border border-cyanGlow/40 rounded-lg p-4 bg-black/40">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm font-semibold">
                    Payroll {run.month}/{run.year}
                  </div>
                  <div className="text-xs opacity-70">
                    Total Net Pay: {run.totalNetPay.toFixed(2)} SAR
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportWps(run.id)}
                    className="px-3 py-1 rounded-full border border-cyanGlow/60 text-xs"
                  >
                    Export WPS
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-2">
                {run.lines.map((line) => (
                  <div key={line.staff.id} className="flex justify-between text-xs">
                    <div>
                      {line.staff.fullName} ({line.staff.email})
                    </div>
                    <div className="text-right">
                      Base: {line.baseSalary.toFixed(2)} | Net: {line.netPay.toFixed(2)}{" "}
                      <button
                        className="text-cyanGlow underline ml-2"
                        type="button"
                        onClick={() =>
                          window.open(`/payroll/runs/${run.id}/payslip/${line.staff.id}`, "_blank")
                        }
                      >
                        Payslip
                      </button>
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
