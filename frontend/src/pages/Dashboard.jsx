import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { materialService } from '../services/materialService';
import { attendanceService } from '../services/attendanceService';
import { reportService } from '../services/reportService';
import { userService } from '../services/userService';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    materials: 0,
    workers: 0,
    reports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [projects, materials, reports, users] = await Promise.all([
          projectService.getAll({ limit: 1 }),
          materialService.getAll({ limit: 1 }),
          reportService.getAll({ limit: 1 }),
          userService.getAll({ limit: 1 }),
        ]);

        setStats({
          projects: projects.pagination?.total || 0,
          materials: materials.pagination?.total || 0,
          workers: users.pagination?.total || 0,
          reports: reports.pagination?.total || 0,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loader />;

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">Welcome back, {user?.name || 'User'}!</p>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Projects" value={stats.projects} icon="📋" color="blue" />
        <StatCard title="Material Requests" value={stats.materials} icon="📦" color="green" />
        <StatCard title="Workers" value={stats.workers} icon="👷" color="yellow" />
        <StatCard title="Daily Reports" value={stats.reports} icon="📝" color="purple" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuickActionsCard />
        <RecentActivityCard />
      </div>
    </section>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full ${colors[color]} p-3 text-2xl`}>{icon}</div>
      </div>
    </div>
  );
};

const QuickActionsCard = () => (
  <div className="rounded-lg bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
    <div className="mt-4 space-y-2">
      <a href="/projects" className="block text-blue-600 hover:text-blue-800">View Projects</a>
      <a href="/materials" className="block text-blue-600 hover:text-blue-800">Manage Materials</a>
      <a href="/attendance" className="block text-blue-600 hover:text-blue-800">Mark Attendance</a>
      <a href="/reports" className="block text-blue-600 hover:text-blue-800">Submit Report</a>
    </div>
  </div>
);

const RecentActivityCard = () => (
  <div className="rounded-lg bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
    <p className="mt-2 text-sm text-gray-600">Activity feed will appear here</p>
  </div>
);

export default Dashboard;

