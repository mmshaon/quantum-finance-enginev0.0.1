'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Button } from '@quantum-finance/ui';
import { api } from '../../../lib/api';
import { API_ROUTES } from '@quantum-finance/config';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-500/20 text-gray-300',
  SENT: 'bg-blue-500/20 text-blue-300',
  PARTIALLY_PAID: 'bg-amber-500/20 text-amber-300',
  PAID: 'bg-green-500/20 text-green-300',
  REJECTED: 'bg-red-500/20 text-red-300',
};

export default function IncomePage() {
  const searchParams = useSearchParams();
  const showNew = searchParams.get('new') === '1';
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewForm, setShowNewForm] = useState(showNew);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    billNumber: '',
    clientName: '',
    clientAddress: '',
    clientContact: '',
    vatEnabled: false,
    vatRate: 15,
    discount: 0,
    items: [{ description: '', quantity: 1, rate: 0 }],
  });

  const fetchBills = async () => {
    try {
      const res = await api.get(API_ROUTES.income.bills);
      setBills(res.data?.data?.bills || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, []);

  const addItem = () => setFormData((d) => ({ ...d, items: [...d.items, { description: '', quantity: 1, rate: 0 }] }));
  const removeItem = (i: number) => setFormData((d) => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, field: string, value: string | number) =>
    setFormData((d) => ({
      ...d,
      items: d.items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const items = formData.items
        .filter((i) => i.description.trim() && Number(i.rate) > 0)
        .map((i) => ({ description: i.description.trim(), quantity: Number(i.quantity) || 1, rate: Number(i.rate) }));
      if (items.length === 0 || !formData.billNumber.trim() || !formData.clientName.trim()) {
        setError('Fill bill number, client name, and at least one item');
        return;
      }
      await api.post(API_ROUTES.income.createBill, {
        billNumber: formData.billNumber.trim(),
        clientName: formData.clientName.trim(),
        clientAddress: formData.clientAddress || undefined,
        clientContact: formData.clientContact || undefined,
        vatEnabled: formData.vatEnabled,
        vatRate: formData.vatEnabled ? formData.vatRate : undefined,
        discount: formData.discount || undefined,
        items,
      });
      setFormData({
        billNumber: '',
        clientName: '',
        clientAddress: '',
        clientContact: '',
        vatEnabled: false,
        vatRate: 15,
        discount: 0,
        items: [{ description: '', quantity: 1, rate: 0 }],
      });
      fetchBills();
      setShowNewForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const viewPdf = (id: string) => window.open(`${process.env.NEXT_PUBLIC_API_URL}${API_ROUTES.income.generatePdf(id)}`, '_blank');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Income & Billing</h1>
          <p className="text-gray-400 mt-1">Manage invoices and bills</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)} variant="primary">
          {showNewForm ? 'Cancel' : '+ Create Bill'}
        </Button>
      </div>

      {showNewForm && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4">New Bill</h2>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Bill Number *</label>
                <input
                  value={formData.billNumber}
                  onChange={(e) => setFormData((d) => ({ ...d, billNumber: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Client Name *</label>
                <input
                  value={formData.clientName}
                  onChange={(e) => setFormData((d) => ({ ...d, clientName: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Client Address</label>
                <input
                  value={formData.clientAddress}
                  onChange={(e) => setFormData((d) => ({ ...d, clientAddress: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Client Contact</label>
                <input
                  value={formData.clientContact}
                  onChange={(e) => setFormData((d) => ({ ...d, clientContact: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.vatEnabled} onChange={(e) => setFormData((d) => ({ ...d, vatEnabled: e.target.checked }))} className="rounded" />
                <span className="text-gray-400">Enable VAT</span>
              </label>
              {formData.vatEnabled && (
                <input
                  type="number"
                  value={formData.vatRate}
                  onChange={(e) => setFormData((d) => ({ ...d, vatRate: parseFloat(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 rounded bg-white/5 border border-cyan-400/30 text-white"
                />
              )}
              <div>
                <label className="text-sm text-cyan-300 mr-2">Discount</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData((d) => ({ ...d, discount: parseFloat(e.target.value) || 0 }))}
                  className="w-24 px-2 py-1 rounded bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-cyan-300 mb-2">Line Items</label>
              {formData.items.map((item, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                  <input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white md:col-span-2"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Rate"
                      value={item.rate || ''}
                      onChange={(e) => updateItem(i, 'rate', e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                    />
                    {formData.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg">✕</button>
                    )}
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add Item</Button>
            </div>
            <Button type="submit" variant="primary" isLoading={submitting}>Create Bill</Button>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <h2 className="p-4 text-lg font-semibold text-cyan-300 border-b border-cyan-400/20">Bills</h2>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : bills.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No bills yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/20">
                  <th className="text-left p-4 text-cyan-300 font-medium">Bill #</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Client</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Total</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Status</th>
                  <th className="text-right p-4 text-cyan-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id} className="border-b border-cyan-400/10 hover:bg-white/5">
                    <td className="p-4 font-medium">{b.billNumber}</td>
                    <td className="p-4">{b.clientName}</td>
                    <td className="p-4">{b.totalAmount}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[b.status] || ''}`}>{b.status}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => viewPdf(b.id)} className="text-cyan-400 hover:underline text-sm">View PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
