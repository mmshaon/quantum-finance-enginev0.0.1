"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "@utils/index";

interface StaffSummary {
  staffId: string;
  name: string;
  email?: string | null;
  presentDays: number;
  leaveDays: number;
  dailyRate: number;
  manpowerCost: number;
}

interface HrSummaryResponse {
  success: boolean;
  project: { id: string; name: string; code: string | null; clientName: string | null; contractValue?: any };
  period: { from: string | null; to: string | null };
  staffSummary: StaffSummary[];
  totalManpowerCost: number;
}

interface ProfitabilityResponse {
  success: boolean;
  project: { id: string; name: string; code: string | null; clientName: string | null; contractValue?: any };
  period: { from: string | null; to: string | null };
  manpowerCost: number;
  otherExpenses: number;
  totalCost: number;
  revenue: number;
  profit: number;
  margin: number;
}

export default function ProjectHrPage() {
  const params = useParams<{ id: string }>();
  const [from, setFrom] = useState(() =>
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [hrData, setHrData] = useState<HrSummaryResponse | null>(null);
  const [profitData, setProfitData] = useState<ProfitabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("qfe-token") || sessionStorage.getItem("qfe-token")
      : null;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [hr, prof] = await Promise.all([
        apiRequest<HrSummaryResponse>(
          `/projects/${params.id}/hr-summary?from=${from}&to=${to}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        apiRequest<ProfitabilityResponse>(
          `/projects/${params.id}/profitability?from=${from}&to=${to}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ]);
      setHrData(hr);
      setProfitData(prof);
    } catch (e: any) {
      setError(e.message || "Failed to load project HR data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, params.id, token]);

  return (
    <main className="min-h-screen p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Project HR & Profitability</h1>
          {hrData && (
            <p className="text-sm opacity-80">
              {hrData.project.name}
              {hrData.project.code ? ` (${hrData.project.code})` : ""} —{" "}
              {hrData.project.clientName || "No client name"}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
          />
        </div>
      </div>

      {loading && <p className="text-xs opacity-70">Loading...</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {!loading && !error && hrData && profitData && (
        <>
          <div className="card grid md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs opacity-70">Collected Revenue</div>
              <div className="text-lg font-semibold">{profitData.revenue.toFixed(2)} SAR</div>
            </div>
            <div>
              <div className="text-xs opacity-70">Manpower Cost</div>
              <div className="text-lg font-semibold text-amber-300">
                {profitData.manpowerCost.toFixed(2)} SAR
              </div>
            </div>
            <div>
              <div className="text-xs opacity-70">Other Expenses</div>
              <div className="text-lg font-semibold text-amber-300">
                {profitData.otherExpenses.toFixed(2)} SAR
              </div>
            </div>
            <div>
              <div className="text-xs opacity-70">Profit / Margin</div>
              <div
                className={`text-lg font-semibold ${
                  profitData.profit >= 0 ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {profitData.profit.toFixed(2)} SAR ({profitData.margin.toFixed(1)}%)
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-3">
              Staff Attendance & Manpower Cost
            </h2>
            <div className="max-h-[500px] overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-black/40">
                    <th className="border border-cyanGlow/40 px-2 py-1 text-left">Staff</th>
                    <th className="border border-cyanGlow/40 px-2 py-1">Present</th>
                    <th className="border border-cyanGlow/40 px-2 py-1">Leave</th>
                    <th className="border border-cyanGlow/40 px-2 py-1">Daily Rate</th>
                    <th className="border border-cyanGlow/40 px-2 py-1">Manpower Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {hrData.staffSummary.map((s) => (
                    <tr key={s.staffId}>
                      <td className="border border-cyanGlow/40 px-2 py-1">
                        <div className="font-semibold">{s.name}</div>
                        <div className="opacity-70">{s.email}</div>
                      </td>
                      <td className="border border-cyanGlow/40 px-2 py-1 text-center">
                        {s.presentDays}
                      </td>
                      <td className="border border-cyanGlow/40 px-2 py-1 text-center">
                        {s.leaveDays}
                      </td>
                      <td className="border border-cyanGlow/40 px-2 py-1 text-right">
                        {s.dailyRate.toFixed(2)}
                      </td>
                      <td className="border border-cyanGlow/40 px-2 py-1 text-right font-semibold">
                        {s.manpowerCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      className="border border-cyanGlow/40 px-2 py-1 text-right font-semibold"
                      colSpan={4}
                    >
                      Total Manpower Cost
                    </td>
                    <td className="border border-cyanGlow/40 px-2 py-1 text-right font-semibold">
                      {hrData.totalManpowerCost.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
