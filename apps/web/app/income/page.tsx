'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function IncomePage() {
  const router = useRouter();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/income`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setBills(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold gradient-text">Income & Billing</h1>
            <a href="/dashboard" className="btn-quantum">Back to Dashboard</a>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4">All Bills</h2>
          {loading ? (
            <p>Loading...</p>
          ) : bills.length === 0 ? (
            <p className="text-gray-400">No bills found</p>
          ) : (
            <div className="space-y-4">
              {bills.map((bill: any) => (
                <div key={bill.id} className="glass-card p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{bill.billNumber}</p>
                      <p className="text-sm text-gray-400">Client: {bill.clientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-cyan-400">SAR {bill.totalAmount}</p>
                      <p className="text-sm text-gray-400">{bill.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
