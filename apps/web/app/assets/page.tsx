'use client';
import { useRouter } from 'next/navigation';

export default function AssetsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold gradient-text">Assets & Liabilities</h1>
            <a href="/dashboard" className="btn-quantum">Back to Dashboard</a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 text-green-400">Assets</h2>
            <p className="text-gray-400">No assets recorded yet</p>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 text-red-400">Liabilities</h2>
            <p className="text-gray-400">No liabilities recorded yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
