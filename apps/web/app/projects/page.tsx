'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold gradient-text">Projects</h1>
            <a href="/dashboard" className="btn-quantum">Back to Dashboard</a>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4">All Projects</h2>
          {loading ? (
            <p>Loading...</p>
          ) : projects.length === 0 ? (
            <p className="text-gray-400">No projects found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project: any) => (
                <div key={project.id} className="glass-card p-4">
                  <h3 className="font-bold text-lg mb-2">{project.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{project.projectNumber}</p>
                  <p className="text-cyan-400 font-semibold">
                    {project.value ? `SAR ${project.value}` : 'No value set'}
                  </p>
                  <p className="text-sm mt-2">
                    Status: <span className={`font-bold ${
                      project.status === 'COMPLETED' ? 'text-green-400' :
                      project.status === 'ACTIVE' ? 'text-cyan-400' :
                      'text-yellow-400'
                    }`}>{project.status}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
