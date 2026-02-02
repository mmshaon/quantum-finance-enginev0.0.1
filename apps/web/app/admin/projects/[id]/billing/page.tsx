"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "@utils/index";

interface InvoiceItemInput {
  description: string;
  quantity: string;
  unitPrice: string;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  issueDate: string;
  dueDate: string | null;
  status: string;
  totalAmount: number;
  notes: string | null;
  collected: number;
  outstanding: number;
}

interface InvoiceListResponse {
  success: boolean;
  invoices: Invoice[];
}

export default function ProjectBillingPage() {
  const params = useParams<{ id: string }>();

  const [invoiceNo, setInvoiceNo] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItemInput[]>([
    { description: "", quantity: "1", unitPrice: "0" }
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payReference, setPayReference] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("qfe-token") || sessionStorage.getItem("qfe-token")
      : null;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiRequest<InvoiceListResponse>(
        `/projects/${params.id}/invoices`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvoices(res.invoices);
    } catch (e: any) {
      setError(e.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, token]);

  const addItem = () =>
    setItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "0" }]);

  const updateItem = (index: number, field: keyof InvoiceItemInput, value: string) => {
    setItems((prev) => prev.map((i, idx) => (idx === index ? { ...i, [field]: value } : i)));
  };

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== index));

  const totalAmount = items.reduce((sum, i) => {
    const q = parseFloat(i.quantity || "0");
    const p = parseFloat(i.unitPrice || "0");
    return sum + (isNaN(q) || isNaN(p) ? 0 : q * p);
  }, 0);

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      const payload = {
        invoiceNo,
        issueDate,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
        items: items
          .filter((i) => i.description && i.quantity && i.unitPrice)
          .map((i) => ({
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice)
          }))
      };
      if (!payload.items.length) {
        setError("Add at least one line item.");
        return;
      }
      await apiRequest(`/projects/${params.id}/invoices`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      setInvoiceNo("");
      setNotes("");
      setItems([{ description: "", quantity: "1", unitPrice: "0" }]);
      load();
    } catch (e: any) {
      setError(e.message || "Failed to create invoice");
    }
  };

  const openPaymentModal = (invoiceId: string, outstanding: number) => {
    setPayInvoiceId(invoiceId);
    setPayAmount(outstanding.toString());
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayReference("");
    setPayModalOpen(true);
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !payInvoiceId) return;
    try {
      await apiRequest(`/invoices/${payInvoiceId}/payments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: Number(payAmount),
          paidDate: payDate,
          reference: payReference || undefined
        })
      });
      setPayModalOpen(false);
      load();
    } catch (e: any) {
      alert(e.message || "Failed to record payment");
    }
  };

  return (
    <main className="min-h-screen p-6 space-y-6">
      <h1 className="text-2xl font-bold">Project Billing & Invoices</h1>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Create Invoice</h2>
        <form onSubmit={createInvoice} className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs mb-1">Invoice No</label>
              <input
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="border border-cyanGlow/40 rounded-lg p-3 bg-black/40"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs opacity-70">Line #{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid md:grid-cols-3 gap-2">
                  <div className="md:col-span-2">
                    <label className="block text-xs mb-1">Description</label>
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Qty / Price</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        className="w-1/2 px-2 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-xs"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                        className="w-1/2 px-2 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1 rounded-full border border-cyanGlow/60 text-xs hover:bg-cyanGlow/10"
            >
              + Add Line
            </button>
            <div className="text-right">
              <div className="text-xs opacity-70">Total</div>
              <div className="text-lg font-semibold">{totalAmount.toFixed(2)} SAR</div>
            </div>
          </div>

          {error && <div className="text-xs text-red-400">{error}</div>}

          <button
            type="submit"
            className="w-full mt-2 py-2 rounded-full bg-cyanGlow text-black font-semibold text-sm"
          >
            Create Invoice
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Invoices</h2>
        {loading && <p className="text-xs opacity-70">Loading...</p>}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="border border-cyanGlow/40 rounded-lg p-3 bg-black/40 flex justify-between items-center"
            >
              <div>
                <div className="text-sm font-semibold">
                  {inv.invoiceNo} — {Number(inv.totalAmount).toFixed(2)} SAR
                </div>
                <div className="text-xs opacity-80">
                  Issue: {new Date(inv.issueDate).toLocaleDateString()}{" "}
                  {inv.dueDate && ` | Due: ${new Date(inv.dueDate).toLocaleDateString()}`}
                </div>
                <div className="text-xs opacity-80">
                  Collected: {inv.collected.toFixed(2)} SAR | Outstanding:{" "}
                  {inv.outstanding.toFixed(2)} SAR
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-xs px-2 py-1 rounded-full mb-2 ${
                    inv.status === "PAID"
                      ? "bg-emerald-900/40 text-emerald-300"
                      : inv.status === "PARTIALLY_PAID"
                      ? "bg-amber-900/40 text-amber-300"
                      : inv.status === "CANCELLED"
                      ? "bg-red-900/40 text-red-300"
                      : "bg-cyanDeep/40 text-cyanGlow"
                  }`}
                >
                  {inv.status}
                </div>
                {inv.outstanding > 0 && (
                  <button
                    onClick={() => openPaymentModal(inv.id, inv.outstanding)}
                    className="px-3 py-1 rounded-full border border-cyanGlow/60 text-xs hover:bg-cyanGlow/10"
                  >
                    Record payment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {payModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-semibold mb-3">Record Payment</h3>
            <form onSubmit={submitPayment} className="space-y-3">
              <div>
                <label className="block text-xs mb-1">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Paid Date</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Reference</label>
                <input
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-3 py-1 rounded-full border border-cyanGlow/60 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-full bg-cyanGlow text-black text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
