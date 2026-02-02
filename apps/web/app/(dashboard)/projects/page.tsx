'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Button } from '@quantum-finance/ui';
import { api } from '../../../lib/api';
import { API_ROUTES } from '@quantum-finance/config';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-gray-500/20 text-gray-300',
  ACTIVE: 'bg-green-500/20 text-green-300',
  ON_HOLD: 'bg-amber-500/20 text-amber-300',
  COMPLETED: 'bg-blue-500/20 text-blue-300',
  CANCELLED: 'bg-red-500/20 text-red-300',
};

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const showNew = searchParams.get('new') === '1';
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewForm, setShowNewForm] = useState(showNew);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    projectNumber: '',
    name: '',
    ownerName: '',
    value: '',
    workType: '',
    startDate: '',
    endDate: '',
  });

  const fetchProjects = async () => {
    try {
      const res = await api.get(API_ROUTES.projects.list);
      setProjects(res.data?.data?.projects || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (!formData.projectNumber.trim() || !formData.name.trim()) {
        setError('Project number and name are required');
        return;
      }
      await api.post(API_ROUTES.projects.create, {
        projectNumber: formData.projectNumber.trim(),
        name: formData.name.trim(),
        ownerName: formData.ownerName || undefined,
        value: formData.value ? parseFloat(formData.value) : undefined,
        workType: formData.workType || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      });
      setFormData({ projectNumber: '', name: '', ownerName: '', value: '', workType: '', startDate: '', endDate: '' });
      fetchProjects();
      setShowNewForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Projects</h1>
          <p className="text-gray-400 mt-1">Manage projects and track progress</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)} variant="primary">
          {showNewForm ? 'Cancel' : '+ New Project'}
        </Button>
      </div>

      {showNewForm && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4">New Project</h2>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Project Number *</label>
                <input
                  value={formData.projectNumber}
                  onChange={(e) => setFormData((d) => ({ ...d, projectNumber: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Project Name *</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Owner Name</label>
                <input
                  value={formData.ownerName}
                  onChange={(e) => setFormData((d) => ({ ...d, ownerName: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData((d) => ({ ...d, value: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Work Type</label>
                <input
                  value={formData.workType}
                  onChange={(e) => setFormData((d) => ({ ...d, workType: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((d) => ({ ...d, startDate: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((d) => ({ ...d, endDate: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
            </div>
            <Button type="submit" variant="primary" isLoading={submitting}>Create Project</Button>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <h2 className="p-4 text-lg font-semibold text-cyan-300 border-b border-cyan-400/20">Project List</h2>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No projects yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/20">
                  <th className="text-left p-4 text-cyan-300 font-medium">Project #</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Name</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Owner</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Value</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Status</th>
                  <th className="text-left p-4 text-cyan-300 font-medium">Dates</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-cyan-400/10 hover:bg-white/5">
                    <td className="p-4 font-medium">{p.projectNumber}</td>
                    <td className="p-4">{p.name}</td>
                    <td className="p-4">{p.ownerName || '-'}</td>
                    <td className="p-4">{p.value ? `${p.value}` : '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[p.status] || ''}`}>{p.status}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {p.startDate ? format(new Date(p.startDate), 'MMM d') : '-'} – {p.endDate ? format(new Date(p.endDate), 'MMM d') : '-'}
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
