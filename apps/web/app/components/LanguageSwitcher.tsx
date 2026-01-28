"use client";

import { useEffect, useState } from "react";
import type { Lang } from "../i18n";

interface Props {
  onChange(lang: Lang): void;
}

export default function LanguageSwitcher({ onChange }: Props) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("qfe-lang") as Lang | null;
    if (stored) {
      setLang(stored);
      onChange(stored);
    }
  }, [onChange]);

  const handleChange = (value: Lang) => {
    setLang(value);
    window.localStorage.setItem("qfe-lang", value);
    onChange(value);
  };

  return (
    <div className="flex gap-2 text-xs">
      {(["en", "bn", "ar"] as Lang[]).map((code) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          className={`px-2 py-1 rounded-full border ${
            lang === code
              ? "border-cyanGlow bg-cyanGlow/20"
              : "border-cyanGlow/40 bg-transparent"
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
