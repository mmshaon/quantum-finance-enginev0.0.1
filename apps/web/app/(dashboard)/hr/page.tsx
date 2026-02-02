'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Button } from '@quantum-finance/ui';
import { api } from '../../../lib/api';
import { API_ROUTES } from '@quantum-finance/config';
import { format } from 'date-fns';

export default function HRPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'staff';
  const showNew = searchParams.get('new') === '1';
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [salarySheets, setSalarySheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewForm, setShowNewForm] = useState(showNew);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    position: '',
    department: '',
    phone: '',
    address: '',
    idNumber: '',
  });
  const [activeTab, setActiveTab] = useState(tab);

  const fetchStaff = async () => {
    try {
      const res = await api.get(API_ROUTES.hr.staff);
      setStaff(res.data?.data?.staff || []);
    } finally {
      setLoading(false);
    }
  };
  const fetchAttendance = async () => {
    try {
      const res = await api.get(API_ROUTES.hr.attendance);
      setAttendance(res.data?.data?.records || []);
    } catch {}
  };
  const fetchSalarySheets = async () => {
    try {
      const res = await api.get(API_ROUTES.hr.salarySheets);
      setSalarySheets(res.data?.data?.sheets || []);
    } catch {}
  };

  useEffect(() => { fetchStaff(); }, []);
  useEffect(() => { if (activeTab === 'attendance') fetchAttendance(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'salary') fetchSalarySheets(); }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (!formData.fullName.trim()) {
        setError('Full name is required');
        return;
      }
      await api.post(API_ROUTES.hr.staff, formData);
      setFormData({ fullName: '', position: '', department: '', phone: '', address: '', idNumber: '' });
      fetchStaff();
      setShowNewForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add staff');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'staff', label: 'Staff', icon: '👥' },
    { id: 'attendance', label: 'Attendance', icon: '📋' },
    { id: 'salary', label: 'Salary Sheets', icon: '💰' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">HR & Admin</h1>
          <p className="text-gray-400 mt-1">Manage staff, attendance, and payroll</p>
        </div>
        {activeTab === 'staff' && (
          <Button onClick={() => setShowNewForm(!showNewForm)} variant="primary">
            {showNewForm ? 'Cancel' : '+ Add Staff'}
          </Button>
        )}
      </div>

      <div className="flex gap-2 border-b border-cyan-400/20 pb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === t.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'staff' && showNewForm && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4">Add Staff</h2>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Full Name *</label>
                <input
                  value={formData.fullName}
                  onChange={(e) => setFormData((d) => ({ ...d, fullName: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Position</label>
                <input
                  value={formData.position}
                  onChange={(e) => setFormData((d) => ({ ...d, position: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Department</label>
                <input
                  value={formData.department}
                  onChange={(e) => setFormData((d) => ({ ...d, department: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">Phone</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-cyan-300 mb-1">Address</label>
                <input
                  value={formData.address}
                  onChange={(e) => setFormData((d) => ({ ...d, address: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-cyan-300 mb-1">ID Number</label>
                <input
                  value={formData.idNumber}
                  onChange={(e) => setFormData((d) => ({ ...d, idNumber: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/30 text-white"
                />
              </div>
            </div>
            <Button type="submit" variant="primary" isLoading={submitting}>Add Staff</Button>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {activeTab === 'staff' && (
          <>
            <h2 className="p-4 text-lg font-semibold text-cyan-300 border-b border-cyan-400/20">Staff List</h2>
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : staff.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No staff yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-400/20">
                      <th className="text-left p-4 text-cyan-300 font-medium">Name</th>
                      <th className="text-left p-4 text-cyan-300 font-medium">Position</th>
                      <th className="text-left p-4 text-cyan-300 font-medium">Department</th>
                      <th className="text-left p-4 text-cyan-300 font-medium">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((s) => (
                      <tr key={s.id} className="border-b border-cyan-400/10 hover:bg-white/5">
                        <td className="p-4 font-medium">{s.fullName}</td>
                        <td className="p-4">{s.position || '-'}</td>
                        <td className="p-4">{s.department || '-'}</td>
                        <td className="p-4">{s.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {activeTab === 'attendance' && (
          <>
            <h2 className="p-4 text-lg font-semibold text-cyan-300 border-b border-cyan-400/20">Attendance Records</h2>
            {attendance.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No attendance records yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-400/20">
                      <th className="text-left p-4 text-cyan-300 font-medium">Staff</th>
                      <th className="text-left p-4 text-cyan-300 font-medium">Date</th>
                      <th className="text-left p-4 text-cyan-300 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a) => (
                      <tr key={a.id} className="border-b border-cyan-400/10">
                        <td className="p-4">{a.staff?.fullName || '-'}</td>
                        <td className="p-4">{format(new Date(a.date), 'MMM d, yyyy')}</td>
                        <td className="p-4">{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {activeTab === 'salary' && (
          <>
            <h2 className="p-4 text-lg font-semibold text-cyan-300 border-b border-cyan-400/20">Salary Sheets</h2>
            {salarySheets.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No salary sheets yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-400/20">
                      <th className="text-left p-4 text-cyan-300 font-medium">Staff</th>
                      <th className="text-left p-4 text-cyan-300 font-medium">Month/Year</th>
                      <th className="text-left p-4 text-cyan-300 font-medium">Net Pay</th>
                      <th className="text-left p-4 text-cyan-300 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salarySheets.map((s) => (
                      <tr key={s.id} className="border-b border-cyan-400/10">
                        <td className="p-4">{s.staff?.fullName || '-'}</td>
                        <td className="p-4">{s.month}/{s.year}</td>
                        <td className="p-4">{s.netPay}</td>
                        <td className="p-4">{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
