'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HRPage() {
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hr/staff`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setStaff(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold gradient-text">HR & Admin</h1>
            <a href="/dashboard" className="btn-quantum">Back to Dashboard</a>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4">Staff Members</h2>
          {loading ? (
            <p>Loading...</p>
          ) : staff.length === 0 ? (
            <p className="text-gray-400">No staff members found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map((member: any) => (
                <div key={member.id} className="glass-card p-4">
                  <h3 className="font-bold text-lg">{member.fullName}</h3>
                  {member.position && (
                    <p className="text-sm text-gray-400">{member.position}</p>
                  )}
                  {member.department && (
                    <p className="text-sm text-cyan-400">{member.department}</p>
                  )}
                  {member.phone && (
                    <p className="text-sm mt-2">📞 {member.phone}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
