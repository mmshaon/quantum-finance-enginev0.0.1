'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@quantum-finance/ui';
import { api } from '../../../lib/api';
import { API_ROUTES } from '@quantum-finance/config';
import { format } from 'date-fns';

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: 'PRIMARY' as string,
    amount: '',
    description: '',
    investorName: '',
    projectId: '',
  });

  const fetchData = async () => {
    try {
      const [invRes, projRes] = await Promise.all([
        api.get(API_ROUTES.investments),
        api.get(API_ROUTES.projects.list),
      ]);
      setInvestments(invRes.data?.data?.investments || []);
      setProjects(projRes.data?.data?.projects || []);
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
      await api.post(API_ROUTES.investments, {
        category: formData.category,
        amount,
        description: formData.description || undefined,
        investorName: formData.investorName || undefined,
        projectId: formData.projectId || undefined,
      });
      setFormData({ category: 'PRIMARY', amount: '', description: '', investorName: '', projectId: '' });
      fetchData();
      setShowNewForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add investment');
    } finally {
      setSubmitting(false);
    }
  };

  const total = investments.reduce((sum, i) => sum + parseFloat(String(i.amount)), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Investments</h1>
          <p className="text-gray-400 mt-1">Track and manage investments</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)} variant="primary">
          {showNewForm ? 'Cancel' : '+ Add Investment'}
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-400">Total Investments</p>
        <p className="text-3xl font-bold text-cyan-300 mt-1">{total.toLocaleString()} SAR</p>
      </Card>

      {showNewForm && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4">New Investment</h2>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((d) => ({ ...d, category: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
              >
                <option value="PRIMARY">Primary</option>
                <option value="PERMANENT">Permanent</option>
                <option value="PROJECT">Project</option>
                <option value="PERSONAL_FUND">Personal Fund</option>
                <option value="INVESTOR_FUND">Investor Fund</option>
              </select>
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
              <label className="block text-sm text-cyan-300 mb-1">Investor Name</label>
              <input
                value={formData.investorName}
                onChange={(e) => setFormData((d) => ({ ...d, investorName: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData((d) => ({ ...d, projectId: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="primary" isLoading={submitting}>Add Investment</Button>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <h2 className="p-4 text-lg font-semibold text-cyan-300 border-b border-cyan-400/20">Investment List</h2>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : investments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No investments yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/20">
                  <th className="text-left p-4 text-cyan-300 font-medium">Date</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Category</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Amount</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Investor</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Project</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((i) => (
                  <tr key={i.id} className="border-b border-cyan-400/10 hover:bg-white/5">
                    <td className="p-4">{format(new Date(i.createdAt), 'MMM d, yyyy')}</td>
                    <td className="p-4">{i.category}</td>
                    <td className="p-4 font-medium">{i.amount}</td>
                    <td className="p-4">{i.investorName || '-'}</td>
                    <td className="p-4">{i.project?.name || '-'}</td>
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
