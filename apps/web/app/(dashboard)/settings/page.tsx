'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@quantum-finance/ui';
import { api } from '../../../lib/api';
import { API_ROUTES } from '@quantum-finance/config';
import { SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } from '@quantum-finance/config';

export default function SettingsPage() {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    language: 'en',
    currency: 'SAR',
    darkModeDefault: true,
  });

  const fetchCompany = async () => {
    try {
      const [companyRes, themeRes] = await Promise.all([
        api.get(API_ROUTES.settings.company),
        api.get(API_ROUTES.settings.theme),
      ]);
      const c = companyRes.data?.data;
      const s = c?.settings;
      setCompany(c);
      setFormData({
        name: c?.name || '',
        address: c?.address || '',
        phone: c?.phone || '',
        email: c?.email || '',
        website: c?.website || '',
        language: s?.language || 'en',
        currency: s?.currency || 'SAR',
        darkModeDefault: s?.darkModeDefault ?? true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompany(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api.put(API_ROUTES.settings.company, {
        name: formData.name,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
      });
      await api.put(`${API_ROUTES.settings.company}/settings`, {
        language: formData.language,
        currency: formData.currency,
        darkModeDefault: formData.darkModeDefault,
      });
      setSuccess('Settings saved successfully');
      fetchCompany();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save settings');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">Settings</h1>
        <p className="text-gray-400 mt-1">Manage company and application settings</p>
      </div>

      <Card className="p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-cyan-300 mb-4">Company Settings</h2>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 rounded-lg bg-green-500/20 text-green-300 text-sm">{success}</div>}
        {loading ? (
          <div className="py-8 text-center text-gray-400">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Company Name</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Address</label>
              <input
                value={formData.address}
                onChange={(e) => setFormData((d) => ({ ...d, address: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Phone</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Website</label>
              <input
                value={formData.website}
                onChange={(e) => setFormData((d) => ({ ...d, website: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-cyan-400/20">
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData((d) => ({ ...d, language: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                >
                  {Object.entries(SUPPORTED_LANGUAGES).map(([k, v]) => (
                    <option key={k} value={k}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData((d) => ({ ...d, currency: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                >
                  {Object.entries(SUPPORTED_CURRENCIES).map(([k, v]) => (
                    <option key={k} value={k}>{v.name} ({v.symbol})</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-4">
              <input
                type="checkbox"
                checked={formData.darkModeDefault}
                onChange={(e) => setFormData((d) => ({ ...d, darkModeDefault: e.target.checked }))}
                className="rounded"
              />
              <span className="text-gray-400">Default dark mode</span>
            </label>
            <Button type="submit" variant="primary" isLoading={submitting}>Save Settings</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
