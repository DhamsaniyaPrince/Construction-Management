import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../../components/Loader';
import workerAnalyticsService from '../../services/workerAnalyticsService';

const WorkerAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await workerAnalyticsService.getWorkerAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Simple pie chart component using SVG
  const PieChart = ({ data, title, colors }) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    let currentAngle = -90; // Start from top

    const createSlice = (value, index) => {
      if (total === 0) return null;
      const percentage = (value / total) * 100;
      const angle = (value / total) * 360;
      const endAngle = currentAngle + angle;
      
      const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
      const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
      const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
      const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M 50 50`,
        `L ${x1} ${y1}`,
        `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      const labelAngle = currentAngle + angle / 2;
      const labelX = 50 + 25 * Math.cos((labelAngle * Math.PI) / 180);
      const labelY = 50 + 25 * Math.sin((labelAngle * Math.PI) / 180);

      currentAngle = endAngle;

      return (
        <g key={index}>
          <path
            d={pathData}
            fill={colors[index % colors.length]}
            stroke="white"
            strokeWidth="2"
          />
          {percentage > 5 && (
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="10"
              fontWeight="bold"
            >
              {`${percentage.toFixed(1)}%`}
            </text>
          )}
        </g>
      );
    };

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
        <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto">
          {Object.entries(data).map(([key, value], index) => 
            createSlice(value, index)
          )}
        </svg>
        <div className="mt-3 space-y-1">
          {Object.entries(data).map(([key, value], index) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded mr-2"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-gray-600">{key}</span>
              </div>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader />
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>
    </div>
  );

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="min-h-screen p-6 pb-20">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Worker Analytics</h1>
            <p className="text-gray-500">Comprehensive insights into workforce performance and distribution</p>
          </div>
          <Link 
            to="/worker-list"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            View Worker Directory →
          </Link>
        </div>
      </header>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{analytics.overview.totalWorkers}</div>
          <div className="text-xs text-gray-500 mt-1">Total Workers</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{analytics.overview.availableWorkers}</div>
          <div className="text-xs text-gray-500 mt-1">Available</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">{analytics.overview.busyWorkers}</div>
          <div className="text-xs text-gray-500 mt-1">Busy</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{analytics.overview.attendanceRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Attendance Rate</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-indigo-600">{analytics.overview.totalTasks}</div>
          <div className="text-xs text-gray-500 mt-1">Total Tasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-pink-600">${analytics.overview.averageWage.toFixed(0)}</div>
          <div className="text-xs text-gray-500 mt-1">Avg Daily Wage</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Task Status Pie Chart */}
        <PieChart 
          data={analytics.taskStats} 
          title="Task Status Distribution" 
          colors={colors}
        />

        {/* Specialization Distribution */}
        <PieChart 
          data={analytics.specializationDistribution} 
          title="Worker Specializations" 
          colors={colors}
        />

        {/* Wage Distribution */}
        <PieChart 
          data={analytics.wageDistribution} 
          title="Wage Ranges" 
          colors={colors}
        />
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performers</h2>
        {analytics.topPerformers.length > 0 ? (
          <div className="space-y-3">
            {analytics.topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{performer.name}</div>
                    <div className="text-xs text-gray-500">{performer.specialization}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{performer.completedTasks}</div>
                  <div className="text-xs text-gray-500">Completed Tasks</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No performance data available yet
          </div>
        )}
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Tasks</h2>
        {analytics.recentTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Task</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Assigned To</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Priority</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentTasks.map((task) => (
                  <tr key={task.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div className="font-medium text-gray-900">{task.title}</div>
                    </td>
                    <td className="py-2 px-3 text-gray-600">{task.assignedTo}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                        task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent tasks found
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerAnalytics;
