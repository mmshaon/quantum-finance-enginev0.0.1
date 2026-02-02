'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));

    // Fetch dashboard stats
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
              <p className="text-gray-300 mt-2">Welcome, {user?.fullName}</p>
            </div>
            <button onClick={handleLogout} className="btn-quantum bg-gradient-to-r from-red-500 to-red-600">
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="text-cyan-400 text-3xl mb-2">💸</div>
            <h3 className="text-gray-300 text-sm">Total Expenses</h3>
            <p className="text-2xl font-bold text-white mt-2">
              SAR {stats?.totalExpenses?.toLocaleString() || '0'}
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="text-green-400 text-3xl mb-2">💰</div>
            <h3 className="text-gray-300 text-sm">Total Income</h3>
            <p className="text-2xl font-bold text-white mt-2">
              SAR {stats?.totalIncome?.toLocaleString() || '0'}
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="text-purple-400 text-3xl mb-2">🏗️</div>
            <h3 className="text-gray-300 text-sm">Active Projects</h3>
            <p className="text-2xl font-bold text-white mt-2">
              {stats?.totalProjects || 0}
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="text-yellow-400 text-3xl mb-2">👥</div>
            <h3 className="text-gray-300 text-sm">Active Staff</h3>
            <p className="text-2xl font-bold text-white mt-2">
              {stats?.activeStaff || 0}
            </p>
          </div>
        </div>

        {/* Module Navigation */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold mb-6">Modules</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <a href="/expenses" className="glass-card p-4 text-center hover:scale-105 transition-transform">
              <div className="text-3xl mb-2">💸</div>
              <p className="text-sm font-semibold">Expenses</p>
            </a>
            <a href="/income" className="glass-card p-4 text-center hover:scale-105 transition-transform">
              <div className="text-3xl mb-2">💰</div>
              <p className="text-sm font-semibold">Income</p>
            </a>
            <a href="/projects" className="glass-card p-4 text-center hover:scale-105 transition-transform">
              <div className="text-3xl mb-2">🏗️</div>
              <p className="text-sm font-semibold">Projects</p>
            </a>
            <a href="/hr" className="glass-card p-4 text-center hover:scale-105 transition-transform">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-sm font-semibold">HR & Admin</p>
            </a>
            <a href="/assets" className="glass-card p-4 text-center hover:scale-105 transition-transform">
              <div className="text-3xl mb-2">🏦</div>
              <p className="text-sm font-semibold">Assets</p>
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        {stats?.pendingApprovals > 0 && (
          <div className="glass-card p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">Pending Approvals</h2>
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
              <p className="text-yellow-200">
                You have {stats.pendingApprovals} expense(s) pending approval
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
