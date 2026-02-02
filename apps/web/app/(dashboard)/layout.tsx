'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { APP_CONFIG, MODULES, SUPPORTED_LANGUAGES } from '@quantum-finance/config';
import { logout } from '../../lib/api';
import { useTheme } from '../providers/ThemeProvider';
import { useLanguage } from '../providers/LanguageProvider';

type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

const navItems = [
  { href: '/dashboard', ...MODULES.DASHBOARD },
  { href: '/expenses', ...MODULES.EXPENSES },
  { href: '/income', ...MODULES.INCOME },
  { href: '/investments', ...MODULES.INVESTMENTS },
  { href: '/assets', ...MODULES.ASSETS },
  { href: '/liabilities', ...MODULES.LIABILITIES },
  { href: '/projects', ...MODULES.PROJECTS },
  { href: '/hr', ...MODULES.HR_ADMIN },
  { href: '/settings', ...MODULES.SETTINGS },
  { href: '/contact', ...MODULES.CONTACT },
];

function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="text-sm font-medium tabular-nums">{time || '--:--:--'}</span>;
}

function ProfileIcon({ name }: { name?: string }) {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  return (
    <div
      className="w-10 h-10 rounded-full bg-cyan-500/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-semibold text-sm"
      title={name}
    >
      {initials}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ fullName?: string; email?: string; profileImage?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('qfe_token') : null;
    const u = typeof window !== 'undefined' ? localStorage.getItem('qfe_user') : null;
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    if (u) setUser(JSON.parse(u));
    setLoading(false);
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark dark:bg-gradient-dark bg-gradient-light">
        <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-light dark:bg-gradient-dark">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900/95 dark:bg-gray-900/95 bg-white/95 backdrop-blur border-r border-cyan-400/20 transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-cyan-400/20">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl font-display font-bold gradient-text">{APP_CONFIG.name}</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      : 'text-gray-400 dark:text-gray-400 hover:bg-white/5 hover:text-white dark:hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main area: header, content, footer */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-gray-900/80 dark:bg-gray-900/80 bg-white/80 backdrop-blur border-b border-cyan-400/20 px-4 lg:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ProfileIcon name={user?.fullName} />
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-cyan-300">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-400/20">
                  <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <LiveClock />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Language Switcher */}
              <div className="flex rounded-lg border border-cyan-400/30 overflow-hidden">
                {(Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      lang === code
                        ? 'bg-cyan-500/30 text-cyan-300'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-white/5 hover:text-cyan-400'
                    }`}
                    title={SUPPORTED_LANGUAGES[code].name}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
                Created by: <span className="text-cyan-600 dark:text-cyan-400 font-medium">{APP_CONFIG.creator}</span>
              </p>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm rounded-lg border border-cyan-400/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-400/10 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-cyan-400/20 bg-gray-900/50 dark:bg-gray-900/50 bg-white/50 py-4 px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600 dark:text-gray-400">
              <span><strong className="text-gray-800 dark:text-cyan-400">Location:</strong> {APP_CONFIG.location}</span>
              <span><strong className="text-gray-800 dark:text-cyan-400">Address:</strong> {APP_CONFIG.address}</span>
              <span><strong className="text-gray-800 dark:text-cyan-400">Company:</strong> {APP_CONFIG.company}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Theme:</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-400/30 hover:bg-cyan-400/10 transition-colors"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <>
                    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-cyan-600 dark:text-cyan-400">Light</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                    <span className="text-cyan-600 dark:text-cyan-400">Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
