"use client";

import { useState } from "react";
import { apiRequest } from "@utils/index";
import { translations, type Lang } from "../../i18n";
import LanguageSwitcher from "../../components/LanguageSwitcher";

export default function RegisterPage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = translations[lang];

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    address: "",
    companyName: "",
    phone: "",
    emergencyContact: "",
    idNumber: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          address: form.address,
          companyName: form.companyName,
          phone: form.phone,
          emergencyContact: form.emergencyContact,
          idNumber: form.idNumber
        })
      });
      setSuccess("Registration submitted. Wait for approval.");
      setForm({
        fullName: "",
        email: "",
        password: "",
        address: "",
        companyName: "",
        phone: "",
        emergencyContact: "",
        idNumber: ""
      });
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-3xl w-full card relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_bottom,_rgba(0,229,255,0.25),_transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold tracking-wide">{t.register}</h1>
            <LanguageSwitcher onChange={setLang} />
          </div>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1">{t.fullName}</label>
              <input
                name="fullName"
                required
                value={form.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 focus:outline-none focus:border-cyanGlow text-sm"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">{t.companyName}</label>
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 focus:outline-none focus:border-cyanGlow text-sm"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">{t.email}</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 focus:outline-none focus:border-cyanGlow text-sm"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">{t.password}</label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 focus:outline-none focus:border-cyanGlow text-sm"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">{t.phone}</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 focus:outline-none focus:border-cyanGlow text-sm"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">
                {t.emergencyContact}
              </label>
              <input
                name="emergencyContact"
                value={form.emergencyContact}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 focus:outline-none focus:border-cyanGlow text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs mb-1">{t.address}</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 focus:outline-none focus:border-cyanGlow text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">{t.idNumber}</label>
              <input
                name="idNumber"
                value={form.idNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 focus:outline-none focus:border-cyanGlow text-sm"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
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
                {loading ? "Processing..." : t.register}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
