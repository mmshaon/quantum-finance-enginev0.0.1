"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@utils/index";
import { translations, type Lang } from "../i18n";

interface Announcement {
  id: string;
  title: string;
  content: string;
}

interface Props {
  lang: Lang;
}

export default function AnnouncementCard({ lang }: Props) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiRequest<{
          success: boolean;
          announcements: Announcement[];
        }>("/announcements");
        if (mounted) {
          setItems(res.announcements);
        }
      } catch (e: any) {
        if (mounted) setError(e.message || "Failed to load announcements");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="card mb-4">
      <h2 className="text-lg font-semibold mb-2">{t.announcement}</h2>
      {loading && <p className="text-xs opacity-70">Loading...</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-xs opacity-70">No announcements yet.</p>
      )}
      <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
        {items.map((a) => (
          <div
            key={a.id}
            className="border border-cyanGlow/40 rounded-lg p-2 bg-black/20"
          >
            <div className="text-sm font-semibold">{a.title}</div>
            <div className="text-xs opacity-80">{a.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
