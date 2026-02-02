"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@utils/index";

interface ExpenseDetail {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  submitter: {
    id: string;
    fullName: string;
    email: string;
  };
  items: {
    id: string;
    description: string;
    amount: number;
    receiptUrl: string | null;
    category: {
      id: string;
      name: string;
    } | null;
  }[];
  statusLogs: {
    id: string;
    status: string;
    comment: string | null;
    createdAt: string;
    changedBy: {
      id: string;
      fullName: string;
      email: string;
    } | null;
  }[];
}

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("qfe-token") ||
        window.sessionStorage.getItem("qfe-token")
      : null;

  const loadExpense = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; expense: ExpenseDetail }>(
        `/expenses/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setExpense(res.expense);
    } catch (e: any) {
      setError(e.message || "Failed to load expense");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpense();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, token]);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-xs opacity-70">Loading expense...</p>
      </main>
    );
  }

  if (error || !expense) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-xs text-red-400 mb-4">{error || "Expense not found"}</p>
        <button
          onClick={() => router.back()}
          className="px-3 py-1 rounded-full border border-cyanGlow/60 text-xs"
        >
          Back
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Expense Detail</h1>
        <button
          onClick={() => router.back()}
          className="px-3 py-1 rounded-full border border-cyanGlow/60 text-xs"
        >
          Back
        </button>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-sm font-semibold">
              {expense.submitter.fullName} ({expense.submitter.email})
            </div>
            <div className="text-xs opacity-70">
              Submitted: {new Date(expense.createdAt).toLocaleString()}
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs ${
              expense.status === "APPROVED"
                ? "bg-emerald-900/40 text-emerald-300"
                : expense.status === "REJECTED"
                ? "bg-red-900/40 text-red-300"
                : expense.status === "REVIEW"
                ? "bg-amber-900/40 text-amber-300"
                : "bg-cyanDeep/40 text-cyanGlow"
            }`}
          >
            {expense.status}
          </span>
        </div>
        <div className="text-sm">
          Total:{" "}
          <span className="font-semibold">
            {Number(expense.totalAmount).toFixed(2)} SAR
          </span>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Items</h2>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {expense.items.map((item) => (
            <div
              key={item.id}
              className="border border-cyanGlow/40 rounded-lg p-3 bg-black/40"
            >
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-semibold">{item.description}</div>
                <div className="text-sm">
                  {Number(item.amount).toFixed(2)} SAR
                </div>
              </div>
              <div className="text-xs opacity-80 mb-1">
                Category: {item.category?.name || "Uncategorized"}
              </div>
              {item.receiptUrl && (
                <a
                  href={item.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyanGlow hover:underline"
                >
                  View receipt
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Status Timeline</h2>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {expense.statusLogs.map((log) => (
            <div key={log.id} className="flex gap-3 items-start">
              <div className="mt-1">
                <div className="w-2 h-2 rounded-full bg-cyanGlow" />
              </div>
              <div>
                <div className="text-xs opacity-70">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
                <div className="text-sm font-semibold">{log.status}</div>
                {log.changedBy && (
                  <div className="text-xs opacity-80">
                    By: {log.changedBy.fullName} ({log.changedBy.email})
                  </div>
                )}
                {log.comment && (
                  <div className="text-xs mt-1 opacity-90">
                    Comment: {log.comment}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
