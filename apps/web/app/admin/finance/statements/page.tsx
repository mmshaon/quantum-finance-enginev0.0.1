"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@utils/index";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

interface AccountRow {
  code: string;
  name: string;
  type: string;
  balance: number;
}

interface StatementSummary {
  balanceSheet: {
    assets: AccountRow[];
    liabilities: AccountRow[];
    equity: AccountRow[];
    totals: { assets: number; liabilities: number; equity: number };
  };
  profitLoss: {
    revenue: AccountRow[];
    expense: AccountRow[];
    totals: { revenue: number; expense: number; netIncome: number };
  };
  cashflow: { inflows: number; outflows: number; net: number };
  equity: { rows: { code: string; name: string; change: number }[]; totalChange: number };
  diffs?: { invoiceId: string; diff: number }[];
}

export default function StatementsPage() {
  const [data, setData] = useState<StatementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("qfe-token") || sessionStorage.getItem("qfe-token")
      : null;

  const fetchStatements = () => {
    if (!token) return;
    setLoading(true);
    apiRequest<StatementSummary>("/statements/overview", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        setData(res);
      })
      .catch((err) => setError(err.message || "Failed to load statements"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleClose = async () => {
    if (!token) return;
    setClosing("Running period close...");
    try {
      const res = await fetch("/accounting/periods/close", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ asOf: new Date().toISOString() })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Close failed");
      setClosing(`Closed. Gain: ${json.totalGain || 0}, Loss: ${json.totalLoss || 0}`);
      fetchStatements();
    } catch (err: any) {
      setClosing(err.message || "Close failed");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-xs opacity-70">Loading statements...</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-xs text-red-400">{error || "No data found"}</p>
      </main>
    );
  }

  const barData = {
    labels: ["Assets", "Liabilities", "Equity"],
    datasets: [
      {
        label: "SAR",
        data: [data.balanceSheet.totals.assets, data.balanceSheet.totals.liabilities, data.balanceSheet.totals.equity],
        backgroundColor: ["#00e5ff88", "#ff980088", "#4caf5088"],
        borderColor: ["#00e5ff", "#ff9800", "#4caf50"],
        borderWidth: 2
      }
    ]
  };

  const lineData = {
    labels: ["Revenue", "Expense", "Net"],
    datasets: [
      {
        label: "SAR",
        data: [
          data.profitLoss.totals.revenue,
          data.profitLoss.totals.expense,
          data.profitLoss.totals.netIncome
        ],
        borderColor: "#00bcd4",
        backgroundColor: "#00bcd488",
        tension: 0.3
      }
    ]
  };

  return (
    <main className="min-h-screen p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Period Statements</h1>
        <button
          onClick={handleClose}
          className="px-4 py-2 rounded-full bg-cyanGlow text-black text-sm font-semibold"
        >
          Close Period
        </button>
      </div>
      {closing && <p className="text-xs text-emerald-300">{closing}</p>}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-xs opacity-70">Total Assets</div>
          <div className="text-2xl font-semibold">{data.balanceSheet.totals.assets.toFixed(2)} SAR</div>
        </div>
        <div className="card text-center">
          <div className="text-xs opacity-70">Total Liabilities</div>
          <div className="text-2xl font-semibold">{data.balanceSheet.totals.liabilities.toFixed(2)} SAR</div>
        </div>
        <div className="card text-center">
          <div className="text-xs opacity-70">Total Equity</div>
          <div className="text-2xl font-semibold">{data.balanceSheet.totals.equity.toFixed(2)} SAR</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Balance Sheet</h2>
          <Bar data={barData} />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Profit & Loss</h2>
          <Line data={lineData} />
          <div className="mt-3 text-xs">
            Net Income: {data.profitLoss.totals.netIncome.toFixed(2)} SAR
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Cashflow</h2>
          <div className="text-sm">
            Inflows: {data.cashflow.inflows.toFixed(2)} SAR<br />
            Outflows: {data.cashflow.outflows.toFixed(2)} SAR<br />
            Net: {data.cashflow.net.toFixed(2)} SAR
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Equity Changes</h2>
          <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
            {data.equity.rows.map((row) => (
              <div key={row.code} className="flex justify-between">
                <div>{row.code} {row.name}</div>
                <div>{row.change.toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="text-xs opacity-70 mt-2">
            Total Equity Change: {data.equity.totalChange.toFixed(2)} SAR
          </div>
        </div>
      </div>
    </main>
  );
}
