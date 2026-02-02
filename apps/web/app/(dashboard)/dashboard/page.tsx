'use client';

import { useEffect, useState } from 'react';
import { Card } from '@quantum-finance/ui';
import { api } from '../../../lib/api';
import { API_ROUTES } from '@quantum-finance/config';
import { SUPPORTED_CURRENCIES } from '@quantum-finance/config';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    expenses: { total: 0, pending: 0 },
    bills: { total: 0, paid: 0 },
    projects: 0,
    staff: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [expRes, incRes, projRes, hrRes] = await Promise.allSettled([
          api.get(API_ROUTES.expenses.list),
          api.get(API_ROUTES.income.bills),
          api.get(API_ROUTES.projects.list),
          api.get(API_ROUTES.hr.staff),
        ]);

        const expenses = expRes.status === 'fulfilled' ? expRes.value.data?.data : null;
        const income = incRes.status === 'fulfilled' ? incRes.value.data?.data : null;
        const projects = projRes.status === 'fulfilled' ? projRes.value.data?.data : null;
        const staff = hrRes.status === 'fulfilled' ? hrRes.value.data?.data : null;

        const expList = expenses?.expenses || [];
        const billList = income?.bills || [];
        const projList = projects?.projects || [];
        const staffList = staff?.staff || [];

        setStats({
          expenses: {
            total: expList.length,
            pending: expList.filter((e: { status: string }) => e.status === 'PENDING').length,
          },
          bills: {
            total: billList.length,
            paid: billList.filter((b: { status: string }) => b.status === 'PAID').length,
          },
          projects: projList.length,
          staff: staffList.length,
        });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const currency = SUPPORTED_CURRENCIES.SAR;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your financial operations</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-32 animate-pulse bg-white/5"><span className="sr-only">Loading</span></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 border-cyan-400/30 hover:border-cyan-400/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Expenses</p>
                <p className="text-2xl font-bold text-cyan-300 mt-1">{stats.expenses.total}</p>
                <p className="text-xs text-amber-400 mt-1">{stats.expenses.pending} pending approval</p>
              </div>
              <span className="text-4xl">💰</span>
            </div>
          </Card>
          <Card className="p-6 border-cyan-400/30 hover:border-cyan-400/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Income Bills</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{stats.bills.total}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.bills.paid} paid</p>
              </div>
              <span className="text-4xl">💵</span>
            </div>
          </Card>
          <Card className="p-6 border-cyan-400/30 hover:border-cyan-400/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Projects</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">{stats.projects}</p>
              </div>
              <span className="text-4xl">🏗️</span>
            </div>
          </Card>
          <Card className="p-6 border-cyan-400/30 hover:border-cyan-400/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Staff Members</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{stats.staff}</p>
              </div>
              <span className="text-4xl">👥</span>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-cyan-300 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <a href="/expenses?new=1" className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-400/30 hover:bg-cyan-500/20 transition-colors text-center">
            <span className="text-2xl block mb-2">➕</span>
            <span className="text-cyan-300 font-medium">New Expense</span>
          </a>
          <a href="/income?new=1" className="p-4 rounded-lg bg-green-500/10 border border-green-400/30 hover:bg-green-500/20 transition-colors text-center">
            <span className="text-2xl block mb-2">📄</span>
            <span className="text-green-300 font-medium">Create Bill</span>
          </a>
          <a href="/projects?new=1" className="p-4 rounded-lg bg-purple-500/10 border border-purple-400/30 hover:bg-purple-500/20 transition-colors text-center">
            <span className="text-2xl block mb-2">📋</span>
            <span className="text-purple-300 font-medium">New Project</span>
          </a>
          <a href="/hr?new=1" className="p-4 rounded-lg bg-blue-500/10 border border-blue-400/30 hover:bg-blue-500/20 transition-colors text-center">
            <span className="text-2xl block mb-2">👤</span>
            <span className="text-blue-300 font-medium">Add Staff</span>
          </a>
        </div>
      </Card>
    </div>
  );
}
