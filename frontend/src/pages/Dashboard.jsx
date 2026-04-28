import { useEffect, useState } from 'react';
import ErrorAlert from '../components/ErrorAlert';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { materialService } from '../services/materialService';
import { projectService } from '../services/projectService';
import { reportService } from '../services/reportService';
import { userService } from '../services/userService';
import { materialRequestService } from '../services/materialRequestService';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    materials: 0,
    workers: 0,
    reports: 0,
    materialRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [projects, materials, reports, users, materialRequests] = await Promise.all([
          projectService.getAll({ limit: 1 }),
          materialService.getAll({ limit: 1 }),
          reportService.getAll({ limit: 1 }),
          userService.getAll({ limit: 1 }),
          materialRequestService.getAllMaterialRequests()
        ]);
        
        setStats({
          projects: projects?.total || projects.length || 0,
          materials: materials?.total || materials.length || 0,
          workers: users?.total || users.length || 0,
          reports: reports?.total || reports.length || 0,
          materialRequests: materialRequests?.count || materialRequests.materialRequests?.length || 0,
        });
      } catch (error) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', error);
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
        <StatCard title="Material Requests" value={stats.materialRequests} icon="📦" circleColor="bg-green-circle" />
        <StatCard title="Workers" value={stats.workers} icon="👷" circleColor="bg-yellow-circle" />
        <StatCard title="Daily Reports" value={stats.reports} icon="📝" circleColor="bg-purple-circle" />
      </div>

      {/* Material Requests Overview */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Material Requests Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Request Status Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">Pending</div>
                <div className="text-sm text-gray-600">Awaiting Engineer Review</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">Engineer Approved</div>
                <div className="text-sm text-gray-600">Ready for Contractor Review</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">Approved</div>
                <div className="text-sm text-gray-600">Final Approval Complete</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">Rejected</div>
                <div className="text-sm text-gray-600">Request Denied</div>
              </div>
            </div>
          </div>
        </div>
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

