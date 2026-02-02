'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@quantum-finance/ui';
import { api } from '../../../lib/api';
import { API_ROUTES } from '@quantum-finance/config';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    value: '',
    isOperatingCash: false,
    acquiredAt: '',
  });

  const fetchData = async () => {
    try {
      const [assRes, catRes] = await Promise.all([
        api.get(API_ROUTES.assets),
        api.get(`${API_ROUTES.assets}/categories`),
      ]);
      setAssets(assRes.data?.data?.assets || []);
      setCategories(catRes.data?.data || []);
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
      const value = parseFloat(formData.value);
      if (!value || value <= 0) {
        setError('Valid value required');
        return;
      }
      await api.post(API_ROUTES.assets, {
        name: formData.name.trim(),
        categoryId: formData.categoryId || undefined,
        description: formData.description || undefined,
        value,
        isOperatingCash: formData.isOperatingCash,
        acquiredAt: formData.acquiredAt || undefined,
      });
      setFormData({ name: '', categoryId: '', description: '', value: '', isOperatingCash: false, acquiredAt: '' });
      fetchData();
      setShowNewForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add asset');
    } finally {
      setSubmitting(false);
    }
  };

  const total = assets.reduce((sum, a) => sum + parseFloat(String(a.value)), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Assets</h1>
          <p className="text-gray-400 mt-1">Track company assets</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)} variant="primary">
          {showNewForm ? 'Cancel' : '+ Add Asset'}
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-400">Total Asset Value</p>
        <p className="text-3xl font-bold text-cyan-300 mt-1">{total.toLocaleString()} SAR</p>
      </Card>

      {showNewForm && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4">New Asset</h2>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Name *</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData((d) => ({ ...d, categoryId: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Value *</label>
              <input
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData((d) => ({ ...d, value: e.target.value }))}
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
              <label className="block text-sm text-cyan-300 mb-1">Acquired Date</label>
              <input
                type="date"
                value={formData.acquiredAt}
                onChange={(e) => setFormData((d) => ({ ...d, acquiredAt: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isOperatingCash}
                onChange={(e) => setFormData((d) => ({ ...d, isOperatingCash: e.target.checked }))}
                className="rounded"
              />
              <span className="text-gray-400">Operating Cash</span>
            </label>
            <Button type="submit" variant="primary" isLoading={submitting}>Add Asset</Button>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <h2 className="p-4 text-lg font-semibold text-cyan-300 border-b border-cyan-400/20">Asset List</h2>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : assets.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No assets yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/20">
                  <th className="text-left p-4 text-cyan-300 font-medium">Name</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Category</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Value</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Operating Cash</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className="border-b border-cyan-400/10 hover:bg-white/5">
                    <td className="p-4 font-medium">{a.name}</td>
                    <td className="p-4">{a.category?.name || '-'}</td>
                    <td className="p-4">{a.value}</td>
                    <td className="p-4">{a.isOperatingCash ? 'Yes' : 'No'}</td>
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
