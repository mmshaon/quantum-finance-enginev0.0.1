"use client";

import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { translations, type Lang } from "../i18n";

export default function Header() {
  const [time, setTime] = useState("");
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleString("en-US", {
          hour12: true
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const t = translations[lang];

  return (
    <header className="flex justify-between items-center p-4 border-b border-cyanGlow bg-black/20 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-cyanGlow shadow-[0_0_20px_rgba(0,229,255,0.8)]" />
        <div>
          <h1 className="text-xl font-bold tracking-wide">{t.systemTitle}</h1>
          <p className="text-xs opacity-80">{t.createdBy}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="font-mono">{time}</span>
        <LanguageSwitcher onChange={setLang} />
      </div>
    </header>
  );
}
