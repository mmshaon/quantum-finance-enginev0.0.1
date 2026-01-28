"use client";

import { useState } from "react";
import { apiRequest } from "@utils/index";
import { translations, type Lang } from "../../i18n";
import AnnouncementCard from "../../components/AnnouncementCard";
import LanguageSwitcher from "../../components/LanguageSwitcher";

export default function LoginPage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = translations[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; token: string }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password })
        }
      );
      if (remember) {
        window.localStorage.setItem("qfe-token", res.token);
      } else {
        window.sessionStorage.setItem("qfe-token", res.token);
      }
      setSuccess("Login successful. Redirecting...");
      // TODO: navigate to dashboard
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block">
          <div className="card">
            <AnnouncementCard lang={lang} />
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(0,229,255,0.25),_transparent_60%)]" />
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold tracking-wide">{t.login}</h1>
              <LanguageSwitcher onChange={setLang} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs mb-1">{t.email}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 focus:outline-none focus:border-cyanGlow text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">{t.password}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 focus:outline-none focus:border-cyanGlow text-sm"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="accent-cyanGlow"
                  />
                  <span>{t.rememberMe}</span>
                </label>
                <button
                  type="button"
                  className="text-cyanGlow hover:underline"
                >
                  {t.forgotPassword}
                </button>
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-900/30 border border-red-500/40 rounded-md px-3 py-2">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-500/40 rounded-md px-3 py-2">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2 rounded-full bg-gradient-to-r from-cyanGlow to-cyanDeep text-sm font-semibold shadow-[0_0_20px_rgba(0,229,255,0.6)] hover:shadow-[0_0_30px_rgba(0,229,255,0.9)] transition-shadow disabled:opacity-60"
              >
                {loading ? "Processing..." : t.login}
              </button>
            </form>

            <div className="mt-4 text-xs opacity-80">
              <p>{t.pendingApproval}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
