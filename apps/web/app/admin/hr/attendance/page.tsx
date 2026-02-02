"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@utils/index";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  notes: string | null;
  staff: { user: { fullName: string; email: string } };
  project: { name: string } | null;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [staffId, setStaffId] = useState("");
  const [status, setStatus] = useState<"PRESENT" | "ABSENT" | "LEAVE">("PRESENT");
  const [notes, setNotes] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("qfe-token") || sessionStorage.getItem("qfe-token")
      : null;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; records: AttendanceRecord[] }>(
        `/hr/attendance?from=${date}&to=${date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(res.records);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      await apiRequest("/hr/attendance", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ staffId, date, status, notes })
      });
      setNotes("");
      load();
    } catch (e: any) {
      setError(e.message || "Failed to save");
    }
  };

  return (
    <main className="min-h-screen p-6 space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Mark Attendance</h2>
        <form onSubmit={submit} className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Staff ID</label>
            <input
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
              placeholder="Staff ID"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
            >
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-cyanGlow/40 text-sm"
            />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-cyanGlow text-black text-sm font-semibold"
            >
              Save
            </button>
          </div>
        </form>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Attendance for {date}</h2>
        {loading && <p className="text-xs opacity-70">Loading...</p>}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {records.map((r) => (
            <div
              key={r.id}
              className="border border-cyanGlow/40 rounded-lg p-3 bg-black/40 flex justify-between items-center"
            >
              <div>
                <div className="text-sm font-semibold">
                  {r.staff.user.fullName} ({r.staff.user.email})
                </div>
                <div className="text-xs opacity-80">
                  {r.project?.name ? `Project: ${r.project.name}` : "No project"}
                </div>
                {r.notes && <div className="text-xs opacity-80 mt-1">Notes: {r.notes}</div>}
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs ${
                  r.status === "PRESENT"
                    ? "bg-emerald-900/40 text-emerald-300"
                    : r.status === "LEAVE"
                    ? "bg-amber-900/40 text-amber-300"
                    : "bg-red-900/40 text-red-300"
                }`}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
