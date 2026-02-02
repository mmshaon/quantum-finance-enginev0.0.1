'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setExpenses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold gradient-text">Expenses</h1>
            <a href="/dashboard" className="btn-quantum">Back to Dashboard</a>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4">All Expenses</h2>
          {loading ? (
            <p>Loading...</p>
          ) : expenses.length === 0 ? (
            <p className="text-gray-400">No expenses found</p>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense: any) => (
                <div key={expense.id} className="glass-card p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Total: SAR {expense.totalAmount}</p>
                    <p className="text-sm text-gray-400">
                      Status: <span className={`font-bold ${
                        expense.status === 'APPROVED' ? 'text-green-400' :
                        expense.status === 'REJECTED' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>{expense.status}</span>
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(expense.createdAt).toLocaleDateString()}
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
