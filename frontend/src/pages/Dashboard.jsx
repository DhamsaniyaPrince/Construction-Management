import { useEffect, useState } from 'react';
import ErrorAlert from '../components/ErrorAlert';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { materialService } from '../services/materialService';
import { projectService } from '../services/projectService';
import { reportService } from '../services/reportService';
import { userService } from '../services/userService';

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

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader /></div>;

  return (
    <section className="animate-fade-in p-2">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
          Dashboard
        </h1>
        <p className="text-gray-500">Welcome back, <span className="font-semibold text-gray-700">{user?.name || 'User'}</span>!</p>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {/* Stats Grid - Matches EXACT reference layout */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Projects" value={stats.projects} icon="📋" circleColor="bg-blue-circle" />
        <StatCard title="Material Requests" value={stats.materials} icon="📦" circleColor="bg-green-circle" />
        <StatCard title="Workers" value={stats.workers} icon="👷" circleColor="bg-yellow-circle" />
        <StatCard title="Daily Reports" value={stats.reports} icon="📝" circleColor="bg-purple-circle" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <QuickActionsCard />
        <RecentActivityCard />
      </div>
    </section>
  );
};

// Stat Card - Exact Replica of Reference
// Left: Title + Big Number
// Right: Colored Circle with Icon
const StatCard = ({ title, value, icon, circleColor }) => {
  return (
    <div className="glass-card flex items-center justify-between p-6 h-32">
      <div className="flex flex-col justify-between h-full">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-4xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`icon-circle ${circleColor} shadow-md`}>
        {/* Using emoji as placeholder for icons to match style roughly, or could use Lucide icons if installed. 
            The reference has flat white icons inside circles. Emoji is robust fallback. */}
        <span className="text-xl filter drop-shadow-sm">{icon}</span>
      </div>
    </div>
  );
};

const QuickActionsCard = () => (
  <div className="glass-panel h-full">
    <h2 className="text-lg font-bold text-gray-800 mb-6">Quick Actions</h2>
    <div className="flex flex-col gap-4 items-start">
        {/* Simple Blue Links per reference */}
      <LinkButton to="/projects" label="View Projects" />
      <LinkButton to="/materials" label="Manage Materials" />
      <LinkButton to="/attendance" label="Mark Attendance" />
      <LinkButton to="/reports" label="Submit Report" />
    </div>
  </div>
);

const LinkButton = ({ to, label }) => (
  <a href={to} className="text-[#3b82f6] hover:text-blue-800 text-sm font-medium transition-colors hover:underline">
    {label}
  </a>
);

const RecentActivityCard = () => (
  <div className="glass-panel h-full min-h-[250px]">
    <h2 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h2>
    <div className="text-sm text-gray-500">
      <p>Activity feed will appear here</p>
    </div>
  </div>
);

export default Dashboard;

