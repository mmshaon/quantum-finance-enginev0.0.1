 "use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@utils/index";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import Link from "next/link";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Expense {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  submitter: {
    fullName: string;
    email: string;
  };
  items: {
    id: string;
    description: string;
    amount: number;
  }[];
  statusLogs: {
    id: string;
    status: string;
    comment: string | null;
    createdAt: string;
  }[];
}

type ActionType = "APPROVE" | "REJECT" | "REVIEW";

export default function AdminExpensesDashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<ActionType | null>(null);
  const [modalExpenseId, setModalExpenseId] = useState<string | null>(null);
  const [modalComment, setModalComment] = useState("");

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("qfe-token") ||
        window.sessionStorage.getItem("qfe-token")
      : null;

  const loadExpenses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; expenses: Expense[] }>(
        "/expenses",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setExpenses(res.expenses);
    } catch (e: any) {
      setError(e.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openModal = (id: string, action: ActionType) => {
    setModalExpenseId(id);
    setModalAction(action);
    setModalComment("");
    setModalOpen(true);
  };

  const performAction = async () => {
    if (!modalExpenseId || !modalAction) return;
    setActionLoading(true);
    try {
      const endpoint =
        modalAction === "APPROVE"
          ? `/expenses/${modalExpenseId}/approve`
          : modalAction === "REJECT"
          ? `/expenses/${modalExpenseId}/reject`
          : `/expenses/${modalExpenseId}/review`;

      await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({ comment: modalComment }),
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setModalOpen(false);
      loadExpenses();
    } catch (e: any) {
      alert(e.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Chart Data (client-side aggregation)
  const chartLabels = ["Daily", "Weekly", "Monthly"];
  const now = Date.now();
  const dailyTotal = expenses
    .filter((e) => new Date(e.createdAt).getTime() >= now - 24 * 60 * 60 * 1000)
    .reduce((sum, e) => sum + Number(e.totalAmount), 0);

  const weeklyTotal = expenses
    .filter((e) => new Date(e.createdAt).getTime() >= now - 7 * 24 * 60 * 60 * 1000)
    .reduce((sum, e) => sum + Number(e.totalAmount), 0);

  const monthlyTotal = expenses
    .filter((e) => new Date(e.createdAt).getTime() >= now - 30 * 24 * 60 * 60 * 1000)
    .reduce((sum, e) => sum + Number(e.totalAmount), 0);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Expenses (SAR)",
        data: [dailyTotal, weeklyTotal, monthlyTotal],
        backgroundColor: ["#00e5ff88", "#00bcd488", "#0088aa88"],
        borderColor: ["#00e5ff", "#00bcd4", "#0088aa"],
        borderWidth: 2
      }
    ]
  };

  return (
    <main className="min-h-screen p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Expenses Dashboard</h1>
        <Link
          href="/admin/expenses/analytics"
          className="text-xs px-3 py-1 rounded-full border border-cyanGlow/60 hover:bg-cyanGlow/10"
        >
          Open Analytics
        </Link>
      </div>

      {/* Charts */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Expense Overview</h2>
        <Bar data={chartData} />
      </div>

      {/* Expense List */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">All Expenses</h2>

        {loading && <p className="text-xs opacity-70">Loading...</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {expenses.map((exp) => {
            const latest = exp.statusLogs[0];
            return (
              <div
                key={exp.id}
                className="border border-cyanGlow/40 rounded-lg p-4 bg-black/40"
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-sm font-semibold">
                      {exp.submitter.fullName} ({exp.submitter.email})
                    </div>
                    <div className="text-xs opacity-70">
                      {new Date(exp.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      exp.status === "APPROVED"
                        ? "bg-emerald-900/40 text-emerald-300"
                        : exp.status === "REJECTED"
                        ? "bg-red-900/40 text-red-300"
                        : exp.status === "REVIEW"
                        ? "bg-amber-900/40 text-amber-300"
                        : "bg-cyanDeep/40 text-cyanGlow"
                    }`}
                  >
                    {exp.status}
                  </span>
                </div>

                <div className="text-sm mb-2">
                  Total:{" "}
                  <span className="font-semibold">
                    {Number(exp.totalAmount).toFixed(2)} SAR
                  </span>
                </div>

                <div className="text-xs opacity-80 mb-2">
                  {exp.items.length} item(s)
                </div>

                {latest && (
                  <div className="text-[11px] opacity-70 mb-3">
                    Last action: {latest.status} — {latest.comment || "No comment"}
                  </div>
                )}

                <Link
                  href={`/admin/expenses/${exp.id}`}
                  className="text-xs text-cyanGlow hover:underline inline-block mb-3"
                >
                  View details
                </Link>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openModal(exp.id, "APPROVE")}
                    className="px-3 py-1 rounded-full bg-emerald-700/40 border border-emerald-400 text-xs hover:bg-emerald-700/60"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => openModal(exp.id, "REJECT")}
                    className="px-3 py-1 rounded-full bg-red-700/40 border border-red-400 text-xs hover:bg-red-700/60"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => openModal(exp.id, "REVIEW")}
                    className="px-3 py-1 rounded-full bg-amber-700/40 border border-amber-400 text-xs hover:bg-amber-700/60"
                  >
                    Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-semibold mb-3">
              {modalAction === "APPROVE"
                ? "Approve Expense"
                : modalAction === "REJECT"
                ? "Reject Expense"
                : "Request Review"}
            </h3>

            <textarea
              rows={3}
              placeholder="Add a comment (optional)"
              value={modalComment}
              onChange={(e) => setModalComment(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 rounded-full border border-cyanGlow/40 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={performAction}
                disabled={actionLoading}
                className="px-4 py-1 rounded-full bg-cyanGlow text-black font-semibold text-xs shadow hover:bg-cyanGlow/80 disabled:opacity-60"
              >
                {actionLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
