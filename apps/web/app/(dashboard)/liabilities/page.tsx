'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@quantum-finance/ui';
import { api } from '../../../lib/api';
import { API_ROUTES } from '@quantum-finance/config';
import { format } from 'date-fns';

export default function LiabilitiesPage() {
  const [liabilities, setLiabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    lenderName: '',
    description: '',
    amount: '',
    dueDate: '',
  });

  const fetchData = async () => {
    try {
      const res = await api.get(API_ROUTES.liabilities);
      setLiabilities(res.data?.data?.liabilities || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const amount = parseFloat(formData.amount);
      if (!amount || amount <= 0) {
        setError('Valid amount required');
        return;
      }
      await api.post(API_ROUTES.liabilities, {
        lenderName: formData.lenderName || undefined,
        description: formData.description || undefined,
        amount,
        dueDate: formData.dueDate || undefined,
      });
      setFormData({ lenderName: '', description: '', amount: '', dueDate: '' });
      fetchData();
      setShowNewForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add liability');
    } finally {
      setSubmitting(false);
    }
  };

  const total = liabilities.reduce((sum, l) => sum + parseFloat(String(l.amount)), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Liabilities</h1>
          <p className="text-gray-400 mt-1">Track company liabilities</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)} variant="primary">
          {showNewForm ? 'Cancel' : '+ Add Liability'}
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-400">Total Liabilities</p>
        <p className="text-3xl font-bold text-red-400 mt-1">{total.toLocaleString()} SAR</p>
      </Card>

      {showNewForm && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4">New Liability</h2>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Lender Name</label>
              <input
                value={formData.lenderName}
                onChange={(e) => setFormData((d) => ({ ...d, lenderName: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData((d) => ({ ...d, amount: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Description</label>
              <input
                value={formData.description}
                onChange={(e) => setFormData((d) => ({ ...d, description: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((d) => ({ ...d, dueDate: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
              />
            </div>
            <Button type="submit" variant="primary" isLoading={submitting}>Add Liability</Button>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <h2 className="p-4 text-lg font-semibold text-cyan-300 border-b border-cyan-400/20">Liability List</h2>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : liabilities.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No liabilities yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/20">
                  <th className="text-left p-4 text-cyan-300 font-medium">Lender</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Amount</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Due Date</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {liabilities.map((l) => (
                  <tr key={l.id} className="border-b border-cyan-400/10 hover:bg-white/5">
                    <td className="p-4 font-medium">{l.lenderName || '-'}</td>
                    <td className="p-4">{l.amount}</td>
                    <td className="p-4">{l.dueDate ? format(new Date(l.dueDate), 'MMM d, yyyy') : '-'}</td>
                    <td className="p-4 text-gray-400">{l.description || '-'}</td>
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
