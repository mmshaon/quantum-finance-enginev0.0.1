"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@utils/index";

interface Invoice {
  id: string;
  invoiceNo: string;
  currencyCode: string | null;
  fxRate: number | null;
  foreignAmount: number | null;
  totalAmount: number;
  collected: number;
  outstanding: number;
}

interface Exposure {
  invoiceId: string;
  invoiceNo: string;
  currency: string;
  invoiceBase: number;
  revaluedBase: number;
  unrealized: number;
  originalRate: number;
  currentRate: number;
}

export default function MultiCurrencyBilling() {
  const [projectId, setProjectId] = useState("");
  const [currencyCode, setCurrencyCode] = useState("SAR");
  const [fxRate, setFxRate] = useState(1);
  const [items, setItems] = useState([{ description: "", quantity: "1", unitPrice: "0" }]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("0");
  const [paymentCurrency, setPaymentCurrency] = useState("SAR");
  const [paymentFxRate, setPaymentFxRate] = useState(1);
  const [exposures, setExposures] = useState<Exposure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("qfe-token") || sessionStorage.getItem("qfe-token")
      : null;

  const fetchFxRate = async (currency: string, setter: (rate: number) => void) => {
    if (!token || currency === "SAR") return setter(1);
    try {
      const res = await apiRequest<{ success: boolean; fx: { rate: number } | null }>(
        `/fx/latest?base=${currency}&quote=SAR`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setter(res.fx?.rate || 1);
    } catch {
      setter(1);
    }
  };

  const loadInvoices = async () => {
    if (!token || !projectId) return;
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; invoices: Invoice[] }>(
        `/projects/${projectId}/invoices`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvoices(res.invoices);
    } catch (e: any) {
      setError(e.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const loadExposures = async () => {
    if (!token) return;
    try {
      const res = await apiRequest<{ success: boolean; exposures: Exposure[]; total: number }>(
        "/fx/unrealized",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExposures(res.exposures);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExposures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const addItem = () =>
    setItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "0" }]);

  const updateItem = (index: number, field: "description" | "quantity" | "unitPrice", value: string) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  };

  const totalForeign = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || "0");
    const price = parseFloat(item.unitPrice || "0");
    return sum + (isNaN(qty) || isNaN(price) ? 0 : qty * price);
  }, 0);

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !token) return;
    setLoading(true);
    try {
      await apiRequest(`/projects/${projectId}/invoices`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          invoiceNo: `INV-${Date.now()}`,
          issueDate: new Date().toISOString(),
          currencyCode,
          items,
          fxRate
        })
      });
      setItems([{ description: "", quantity: "1", unitPrice: "0" }]);
      loadInvoices();
      loadExposures();
    } catch (e: any) {
      setError(e.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !token) return;
    setLoading(true);
    try {
      await apiRequest(`/invoices/${selectedInvoiceId}/payments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          paidDate: new Date().toISOString(),
          currencyCode: paymentCurrency,
          fxRate: paymentFxRate
        })
      });
      loadInvoices();
      loadExposures();
    } catch (e: any) {
      setError(e.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 space-y-6">
      <h1 className="text-2xl font-bold">Multi-Currency Billing</h1>
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Create FX Invoice</h2>
        <form onSubmit={createInvoice} className="space-y-3">
          <div className="grid md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs opacity-70">Project ID</label>
              <input
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs opacity-70">Currency</label>
              <input
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
              />
              <button
                type="button"
                onClick={() => fetchFxRate(currencyCode, setFxRate)}
                className="px-3 py-1 rounded-full border border-cyanGlow/60 text-xs"
              >
                Fetch FX
              </button>
            </div>
            <div>
              <label className="text-xs opacity-70">FX Rate</label>
              <input
                type="number"
                step="0.0001"
                value={fxRate}
                onChange={(e) => setFxRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
              />
            </div>
            <div className="text-right">
              <div className="text-xs opacity-70">Foreign Total</div>
              <div className="text-lg font-semibold">{totalForeign.toFixed(2)} {currencyCode}</div>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {items.map((item, idx) => (
              <div key={idx} className="border border-cyanGlow/40 rounded-lg p-3 bg-black/40">
                <div className="grid md:grid-cols-3 gap-2">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    placeholder="Description"
                    className="px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    className="px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                    className="px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
                    placeholder="Unit Price"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1 rounded-full border border-cyanGlow/60 text-xs"
            >
              + Line
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-cyanGlow text-black text-sm font-semibold"
            >
              Create Invoice
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Invoices</h2>
        {loading && <p className="text-xs opacity-70">Loading...</p>}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="border border-cyanGlow/40 rounded-lg p-3 bg-black/40 flex justify-between items-center text-xs"
            >
              <div>
                <div className="font-semibold">{inv.invoiceNo}</div>
                <div>
                  Currency: {inv.currencyCode || "SAR"} | FX: {inv.fxRate?.toFixed(4) || "1"} | Outstanding: {inv.outstanding.toFixed(2)} SAR
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoiceId(inv.id)}
                className="px-3 py-1 rounded-full border border-cyanGlow/60 text-xs"
              >
                Select
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">FX Payment</h2>
        <form onSubmit={recordPayment} className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs opacity-70">Invoice ID</label>
            <input
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
            />
          </div>
          <div>
            <label className="text-xs opacity-70">Amount (foreign)</label>
            <input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs opacity-70">Currency</label>
            <input
              value={paymentCurrency}
              onChange={(e) => setPaymentCurrency(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
            />
            <button
              type="button"
              onClick={() => fetchFxRate(paymentCurrency, setPaymentFxRate)}
              className="px-3 py-1 rounded-full border border-cyanGlow/60 text-xs"
            >
              Fetch FX
            </button>
          </div>
          <div>
            <label className="text-xs opacity-70">FX Rate</label>
            <input
              type="number"
              step="0.0001"
              value={paymentFxRate}
              onChange={(e) => setPaymentFxRate(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
            />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-cyanGlow text-black text-sm font-semibold"
            >
              Record Payment
            </button>
          </div>
        </form>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Unrealized FX Exposures</h2>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-2 text-xs">
          {exposures.map((exp) => (
            <div key={exp.invoiceId} className="border border-cyanGlow/40 rounded-lg p-2 bg-black/40">
              <div className="font-semibold">{exp.invoiceNo}</div>
              <div>
                Currency: {exp.currency} | Invoice Base: {exp.invoiceBase.toFixed(2)} SAR
              </div>
              <div>
                Current Rate: {exp.currentRate.toFixed(4)} | Unrealized: {exp.unrealized.toFixed(2)} SAR
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
