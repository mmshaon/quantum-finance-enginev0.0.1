"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@utils/index";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

interface CashflowTotals {
  collected: number;
  invoiced: number;
  outstanding: number;
  expenses: number;
  manpowerCost: number;
  netCashflow: number;
}

export default function CashflowDashboard() {
  const [totals, setTotals] = useState<CashflowTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("qfe-token") ||
        sessionStorage.getItem("qfe-token")
      : null;

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ success: boolean; totals: CashflowTotals }>(
        "/cashflow/summary",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setTotals(res.totals);
    } catch (e: any) {
      setError(e.message || "Failed to load cashflow");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-xs opacity-70">Loading cashflow...</p>
      </main>
    );
  }

  if (error || !totals) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-xs text-red-400">{error || "No data"}</p>
      </main>
    );
  }

  const barData = {
    labels: ["Collected", "Expenses", "Manpower", "Net Cashflow"],
    datasets: [
      {
        label: "SAR",
        data: [
          totals.collected,
          totals.expenses,
          totals.manpowerCost,
          totals.netCashflow
        ],
        backgroundColor: ["#00e5ff88", "#ff980088", "#ffc10788", "#4caf5088"],
        borderColor: ["#00e5ff", "#ff9800", "#ffc107", "#4caf50"],
        borderWidth: 2
      }
    ]
  };

  const lineData = {
    labels: ["Invoiced", "Collected", "Outstanding"],
    datasets: [
      {
        label: "SAR",
        data: [totals.invoiced, totals.collected, totals.outstanding],
        borderColor: "#00e5ff",
        backgroundColor: "#00e5ff44",
        borderWidth: 2,
        tension: 0.3
      }
    ]
  };

  return (
    <main className="min-h-screen p-6 space-y-6">
      <h1 className="text-2xl font-bold">Global Cashflow Dashboard</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Cashflow Overview</h2>
          <Bar data={barData} />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Revenue Flow</h2>
          <Line data={lineData} />
        </div>
      </div>

      <div className="card grid md:grid-cols-3 gap-4">
        <div>
          <div className="text-xs opacity-70">Total Invoiced</div>
          <div className="text-lg font-semibold">
            {totals.invoiced.toFixed(2)} SAR
          </div>
        </div>
        <div>
          <div className="text-xs opacity-70">Total Collected</div>
          <div className="text-lg font-semibold text-emerald-300">
            {totals.collected.toFixed(2)} SAR
          </div>
        </div>
        <div>
          <div className="text-xs opacity-70">Outstanding</div>
          <div className="text-lg font-semibold text-amber-300">
            {totals.outstanding.toFixed(2)} SAR
          </div>
        </div>
      </div>
    </main>
  );
}
