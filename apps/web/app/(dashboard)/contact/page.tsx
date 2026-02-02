'use client';

import { useState } from 'react';
import { Card, Button } from '@quantum-finance/ui';
import { api } from '../../../lib/api';
import { API_ROUTES } from '@quantum-finance/config';
import { APP_CONFIG } from '@quantum-finance/config';

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api.post(API_ROUTES.contact, formData);
      setSuccess('Message sent successfully. We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">Contact & Help</h1>
        <p className="text-gray-400 mt-1">Get in touch with us or send a support request</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4">Send a Message</h2>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-lg bg-green-500/20 text-green-300 text-sm">{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm text-cyan-300 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Subject *</label>
              <input
                value={formData.subject}
                onChange={(e) => setFormData((d) => ({ ...d, subject: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-cyan-300 mb-1">Message *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))}
                rows={5}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white resize-none"
                required
              />
            </div>
            <Button type="submit" variant="primary" isLoading={submitting}>Send Message</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4">Contact Information</h2>
          <div className="space-y-4 text-gray-400">
            <p><strong className="text-cyan-300">Company:</strong> {APP_CONFIG.company}</p>
            <p><strong className="text-cyan-300">Creator:</strong> {APP_CONFIG.creator}</p>
            <p><strong className="text-cyan-300">App:</strong> {APP_CONFIG.name}</p>
            <p><strong className="text-cyan-300">Version:</strong> {APP_CONFIG.version}</p>
          </div>
          <div className="mt-6 pt-6 border-t border-cyan-400/20">
            <h3 className="text-cyan-300 font-medium mb-2">Need Help?</h3>
            <p className="text-sm text-gray-400">Use the form to send your questions or feedback. We typically respond within 24-48 hours.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
