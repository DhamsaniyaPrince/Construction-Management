import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../../components/Loader';
import workerAnalyticsService from '../../services/workerAnalyticsService';

const WorkerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workerData, setWorkerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkerData();
  }, [id]);

  const fetchWorkerData = async () => {
    try {
      const data = await workerAnalyticsService.getWorkerById(id);
      setWorkerData(data);
    } catch (err) {
      console.error('Failed to fetch worker data:', err);
      setError('Failed to load worker data');
    } finally {
      setLoading(false);
    }
  };

  // Pie chart component
  const PieChart = ({ data, title, colors }) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    let currentAngle = -90;

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
                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Bar chart component for monthly data
  const BarChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.total), 1);

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
        <div className="space-y-2">
          {data.map((month, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-16 text-xs text-gray-600">{month.month}</div>
              <div className="flex-1 flex space-x-1">
                <div 
                  className="bg-blue-500 rounded-sm" 
                  style={{ 
                    height: '20px', 
                    width: `${(month.completed / maxValue) * 100}%` 
                  }}
                  title={`Completed: ${month.completed}`}
                />
                <div 
                  className="bg-yellow-500 rounded-sm" 
                  style={{ 
                    height: '20px', 
                    width: `${(month.inProgress / maxValue) * 100}%` 
                  }}
                  title={`In Progress: ${month.inProgress}`}
                />
                <div 
                  className="bg-gray-400 rounded-sm" 
                  style={{ 
                    height: '20px', 
                    width: `${(month.pending / maxValue) * 100}%` 
                  }}
                  title={`Pending: ${month.pending}`}
                />
              </div>
              <div className="w-8 text-xs text-gray-600">{month.total}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center space-x-4 mt-3 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded mr-1"></div>
            <span>Pending</span>
          </div>
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

  if (!workerData) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">Worker not found</div>
    </div>
  );

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="min-h-screen p-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={() => navigate('/worker-analytics')}
            className="text-blue-600 hover:text-blue-800 mb-2 text-sm font-medium"
          >
            ← Back to Worker Analytics
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{workerData.worker.name}</h1>
          <p className="text-gray-500">Individual Worker Performance Analysis</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          workerData.worker.isAvailable 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {workerData.worker.isAvailable ? 'Available' : 'Busy'}
        </div>
      </div>

      {/* Worker Info Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Worker Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="font-medium">{workerData.worker.email}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Phone</div>
            <div className="font-medium">{workerData.worker.phone || 'Not provided'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Specialization</div>
            <div className="font-medium">{workerData.worker.specialization}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Daily Wage</div>
            <div className="font-medium">${workerData.worker.dailyWage}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Join Date</div>
            <div className="font-medium">
              {new Date(workerData.worker.joinDate).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Last Login</div>
            <div className="font-medium">
              {workerData.worker.lastLogin 
                ? new Date(workerData.worker.lastLogin).toLocaleDateString()
                : 'Never'
              }
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Completion Rate</div>
            <div className="font-medium text-green-600">{workerData.performance.completionRate}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Avg Completion Time</div>
            <div className="font-medium">{workerData.performance.avgCompletionTime} days</div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{workerData.performance.taskStats.total}</div>
          <div className="text-xs text-gray-500 mt-1">Total Tasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{workerData.performance.taskStats.completed}</div>
          <div className="text-xs text-gray-500 mt-1">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{workerData.performance.taskStats.inProgress}</div>
          <div className="text-xs text-gray-500 mt-1">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">${workerData.performance.totalEarnings}</div>
          <div className="text-xs text-gray-500 mt-1">Total Earnings</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <PieChart 
          data={workerData.performance.taskStats} 
          title="Task Status" 
          colors={colors}
        />
        <PieChart 
          data={workerData.performance.priorityStats} 
          title="Priority Distribution" 
          colors={colors}
        />
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Project Distribution</h3>
          <div className="space-y-2">
            {Object.entries(workerData.projectDistribution).map(([project, count], index) => (
              <div key={project} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm text-gray-600 truncate max-w-[120px]">{project}</span>
                </div>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(workerData.projectDistribution).length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">No projects assigned</div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Performance Chart */}
      <div className="mb-8">
        <BarChart 
          data={workerData.monthlyData} 
          title="Monthly Performance (Last 6 Months)" 
        />
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Tasks</h2>
        {workerData.recentTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Task</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Priority</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Project</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Assigned By</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {workerData.recentTasks.map((task) => (
                  <tr key={task.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div className="font-medium text-gray-900">{task.title}</div>
                    </td>
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
                    <td className="py-2 px-3 text-gray-600">{task.project}</td>
                    <td className="py-2 px-3 text-gray-600">{task.assignedBy}</td>
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
            No tasks found for this worker
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDetail;
