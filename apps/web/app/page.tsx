export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-4xl">
        <h1 className="text-6xl md:text-7xl font-bold gradient-text animate-fade-in">
          Quantum Finance Engine
        </h1>
        
        <p className="text-2xl text-cyan-300">
          Multi-Platform Financial Management & Operations Engine
        </p>
        
        <div className="glass-card p-8 mt-8">
          <p className="text-lg mb-6">
            Created by <span className="text-cyan-400 font-semibold">Mohammad Maynul Hasan</span>
          </p>
          <p className="text-gray-300 mb-8">
            Alpha Ultimate Ltd
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/auth/login" className="btn-quantum">
              Login
            </a>
            <a href="/auth/register" className="btn-quantum bg-gradient-to-r from-green-500 to-green-600">
              Register
            </a>
            <a href="/dashboard" className="btn-quantum bg-gradient-to-r from-purple-500 to-purple-600">
              Dashboard
            </a>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="glass-card p-6 hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">💸</div>
            <h3 className="text-xl font-bold mb-2">Expense Management</h3>
            <p className="text-gray-300">Track and approve expenses with ease</p>
          </div>
          
          <div className="glass-card p-6 hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Financial Analytics</h3>
            <p className="text-gray-300">Real-time insights and reporting</p>
          </div>
          
          <div className="glass-card p-6 hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2">HR Management</h3>
            <p className="text-gray-300">Complete staff and payroll solution</p>
          </div>
        </div>
      </div>
    </main>
  )
}
