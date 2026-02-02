"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@utils/index";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface CategoryDatum {
  name: string;
  amount: number;
}

interface SubmitterDatum {
  id: string;
  name: string;
  amount: number;
}

export default function ExpenseAnalyticsPage() {
  const [categoryData, setCategoryData] = useState<CategoryDatum[]>([]);
  const [submitterData, setSubmitterData] = useState<SubmitterDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("qfe-token") ||
        window.sessionStorage.getItem("qfe-token")
      : null;

  const loadSummary = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiRequest<{
        success: boolean;
        categoryData: CategoryDatum[];
        submitterData: SubmitterDatum[];
      }>("/expenses/summary", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCategoryData(res.categoryData);
      setSubmitterData(res.submitterData);
    } catch (e: any) {
      setError(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const categoryPieData = {
    labels: categoryData.map((c) => c.name),
    datasets: [
      {
        data: categoryData.map((c) => c.amount),
        backgroundColor: [
          "#00e5ff88",
          "#00bcd488",
          "#0088aa88",
          "#4caf5088",
          "#ff980088",
          "#ffc10788"
        ],
        borderColor: [
          "#00e5ff",
          "#00bcd4",
          "#0088aa",
          "#4caf50",
          "#ff9800",
          "#ffc107"
        ],
        borderWidth: 2
      }
    ]
  };

  const submitterBarData = {
    labels: submitterData.map((s) => s.name),
    datasets: [
      {
        label: "Total Expenses (SAR)",
        data: submitterData.map((s) => s.amount),
        backgroundColor: "#00e5ff88",
        borderColor: "#00e5ff",
        borderWidth: 2
      }
    ]
  };

  return (
    <main className="min-h-screen p-6 space-y-6">
      <h1 className="text-2xl font-bold">Expense Analytics</h1>

      {loading && <p className="text-xs opacity-70">Loading analytics...</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {!loading && !error && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">By Category</h2>
            {categoryData.length === 0 ? (
              <p className="text-xs opacity-70">No data available.</p>
            ) : (
              <Pie data={categoryPieData} />
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Top Submitters</h2>
            {submitterData.length === 0 ? (
              <p className="text-xs opacity-70">No data available.</p>
            ) : (
              <Bar data={submitterBarData} />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
