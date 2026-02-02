"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@utils/index";

interface SalaryRow {
  staffId: string;
  name: string;
  email?: string | null;
  presentDays: number;
  leaveDays: number;
  baseSalary: number;
  advances: number;
  adjustments: number;
  netPayable: number;
}

interface SalarySheetResponse {
  success: boolean;
  period: { month: number; year: number };
  sheet: SalaryRow[];
}

export default function SalarySheetPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<SalarySheetResponse | null>(null);
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
      const res = await apiRequest<SalarySheetResponse>(
        `/hr/salary-sheet?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res);
    } catch (e: any) {
      setError(e.message || "Failed to load salary sheet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, token]);

  return (
    <main className="min-h-screen p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Salary Sheet</h1>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-20 px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
          />
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
          />
        </div>
      </div>

      <div className="card">
        {loading && <p className="text-xs opacity-70">Loading...</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
        {data && (
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-black/40">
                  <th className="border border-cyanGlow/40 px-2 py-1 text-left">Staff</th>
                  <th className="border border-cyanGlow/40 px-2 py-1">Present</th>
                  <th className="border border-cyanGlow/40 px-2 py-1">Leave</th>
                  <th className="border border-cyanGlow/40 px-2 py-1">Base Salary</th>
                  <th className="border border-cyanGlow/40 px-2 py-1">Advances</th>
                  <th className="border border-cyanGlow/40 px-2 py-1">Adjustments</th>
                  <th className="border border-cyanGlow/40 px-2 py-1">Net Payable</th>
                </tr>
              </thead>
              <tbody>
                {data.sheet.map((row) => (
                  <tr key={row.staffId}>
                    <td className="border border-cyanGlow/40 px-2 py-1">
                      <div className="font-semibold">{row.name}</div>
                      <div className="opacity-70">{row.email}</div>
                    </td>
                    <td className="border border-cyanGlow/40 px-2 py-1 text-center">
                      {row.presentDays}
                    </td>
                    <td className="border border-cyanGlow/40 px-2 py-1 text-center">
                      {row.leaveDays}
                    </td>
                    <td className="border border-cyanGlow/40 px-2 py-1 text-right">
                      {row.baseSalary.toFixed(2)}
                    </td>
                    <td className="border border-cyanGlow/40 px-2 py-1 text-right text-amber-300">
                      {row.advances.toFixed(2)}
                    </td>
                    <td className="border border-cyanGlow/40 px-2 py-1 text-right text-emerald-300">
                      {row.adjustments.toFixed(2)}
                    </td>
                    <td className="border border-cyanGlow/40 px-2 py-1 text-right font-semibold">
                      {row.netPayable.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
