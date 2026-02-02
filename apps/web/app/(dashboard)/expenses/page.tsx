'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Button } from '@quantum-finance/ui';
import { api } from '../../../lib/api';
import { API_ROUTES } from '@quantum-finance/config';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  REVIEW: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  APPROVED: 'bg-green-500/20 text-green-300 border-green-400/30',
  REJECTED: 'bg-red-500/20 text-red-300 border-red-400/30',
};

export default function ExpensesPage() {
  const searchParams = useSearchParams();
  const showNew = searchParams.get('new') === '1';
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ items: [{ description: '', amount: '' }] });
  const [user, setUser] = useState<{ isCreator?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [expRes, catRes] = await Promise.all([
        api.get(API_ROUTES.expenses.list),
        api.get(`${API_ROUTES.expenses.list}/categories`),
      ]);
      setExpenses(expRes.data?.data?.expenses || []);
      setCategories(catRes.data?.data || []);
      const u = typeof window !== 'undefined' ? localStorage.getItem('qfe_user') : null;
      if (u) setUser(JSON.parse(u));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addItem = () => setFormData((d) => ({ ...d, items: [...d.items, { description: '', amount: '' }] }));
  const removeItem = (i: number) => setFormData((d) => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, field: string, value: string) =>
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
        .filter((i) => i.description.trim() && parseFloat(i.amount) > 0)
        .map((i) => ({ description: i.description.trim(), amount: parseFloat(i.amount) }));
      if (items.length === 0) {
        setError('Add at least one item');
        return;
      }
      await api.post(API_ROUTES.expenses.create, { items });
      setFormData({ items: [{ description: '', amount: '' }] });
      fetchData();
      setShowNewForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(API_ROUTES.expenses.approve(id), {});
      fetchData();
    } catch {}
  };
  const handleReject = async (id: string) => {
    try {
      await api.post(API_ROUTES.expenses.reject(id), {});
      fetchData();
    } catch {}
  };

  const [showNewForm, setShowNewForm] = useState(showNew);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Expenses</h1>
          <p className="text-gray-400 mt-1">Manage and track expenses</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)} variant="primary">
          {showNewForm ? 'Cancel' : '+ New Expense'}
        </Button>
      </div>

      {showNewForm && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4">New Expense</h2>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {formData.items.map((item, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white col-span-2"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => updateItem(i, 'amount', e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                  />
                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={addItem}>+ Add Item</Button>
              <Button type="submit" variant="primary" isLoading={submitting}>Submit</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <h2 className="p-4 text-lg font-semibold text-cyan-300 border-b border-cyan-400/20">Expense List</h2>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No expenses yet. Create your first expense above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/20">
                  <th className="text-left p-4 text-cyan-300 font-medium">Date</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Submitter</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Amount</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Status</th>
                  {(user?.isCreator) && <th className="text-right p-4 text-cyan-300 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-cyan-400/10 hover:bg-white/5">
                    <td className="p-4 text-gray-300">{format(new Date(e.createdAt), 'MMM d, yyyy')}</td>
                    <td className="p-4">{e.submitter?.fullName || '-'}</td>
                    <td className="p-4 font-medium">{e.totalAmount}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs border ${STATUS_COLORS[e.status] || 'bg-gray-500/20'}`}>
                        {e.status}
                      </span>
                    </td>
                    {(user?.isCreator) && e.status === 'PENDING' && (
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => handleApprove(e.id)} className="text-green-400 hover:underline text-sm">Approve</button>
                        <button onClick={() => handleReject(e.id)} className="text-red-400 hover:underline text-sm">Reject</button>
                      </td>
                    )}
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
