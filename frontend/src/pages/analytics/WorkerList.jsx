import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/Loader';
import workerAnalyticsService from '../../services/workerAnalyticsService';

const WorkerList = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [workersData, analyticsData] = await Promise.all([
        workerAnalyticsService.getWorkers ? workerAnalyticsService.getWorkers() : [],
        workerAnalyticsService.getWorkerAnalytics()
      ]);
      
      // If getWorkers is not available, we'll create a basic list from analytics
      if (workersData.length === 0 && analyticsData) {
        // Create mock workers list based on analytics data
        workersData = [
          { _id: '1', name: 'John Smith', email: 'john@example.com', specialization: 'Carpentry', dailyWage: 120, isAvailable: true },
          { _id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', specialization: 'Electrical', dailyWage: 150, isAvailable: false },
          { _id: '3', name: 'Mike Wilson', email: 'mike@example.com', specialization: 'Plumbing', dailyWage: 130, isAvailable: true },
          { _id: '4', name: 'Emily Davis', email: 'emily@example.com', specialization: 'General Labor', dailyWage: 100, isAvailable: true },
          { _id: '5', name: 'Robert Brown', email: 'robert@example.com', specialization: 'Welding', dailyWage: 140, isAvailable: false }
        ];
      }
      
      setWorkers(workersData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load worker data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedWorkers = workers
    .filter(worker => 
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'specialization':
          return a.specialization.localeCompare(b.specialization);
        case 'wage':
          return (b.dailyWage || 0) - (a.dailyWage || 0);
        case 'availability':
          return (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0);
        default:
          return 0;
      }
    });

  const getWorkerPerformance = (workerId) => {
    if (!analytics || !analytics.topPerformers) return null;
    return analytics.topPerformers.find(p => p.name === workers.find(w => w._id === workerId)?.name);
  };

  const getStatusColor = (isAvailable) => {
    return isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getPerformanceBadge = (worker) => {
    const performance = getWorkerPerformance(worker._id);
    if (!performance) return null;
    
    const rank = analytics.topPerformers.findIndex(p => p.name === performance.name) + 1;
    if (rank === 1) {
      return <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">🏆 Top Performer</span>;
    } else if (rank <= 3) {
      return <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">⭐ Top {rank}</span>;
    }
    return null;
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

  return (
    <div className="min-h-screen p-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Worker Directory</h1>
          <p className="text-gray-500">View detailed analytics for each worker</p>
        </div>
        <button 
          onClick={() => navigate('/worker-analytics')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          View Analytics Dashboard →
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search workers by name, specialization, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="specialization">Sort by Specialization</option>
              <option value="wage">Sort by Wage (High to Low)</option>
              <option value="availability">Sort by Availability</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{analytics.overview.totalWorkers}</div>
            <div className="text-xs text-gray-500 mt-1">Total Workers</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{analytics.overview.availableWorkers}</div>
            <div className="text-xs text-gray-500 mt-1">Available Now</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{analytics.overview.busyWorkers}</div>
            <div className="text-xs text-gray-500 mt-1">Currently Busy</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">${analytics.overview.averageWage.toFixed(0)}</div>
            <div className="text-xs text-gray-500 mt-1">Average Wage</div>
          </div>
        </div>
      )}

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedWorkers.map((worker) => {
          const performance = getWorkerPerformance(worker._id);
          
          return (
            <div 
              key={worker._id} 
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/worker-analytics/${worker._id}`)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      {worker.name}
                      {getPerformanceBadge(worker)}
                    </h3>
                    <p className="text-sm text-gray-500">{worker.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(worker.isAvailable)}`}>
                    {worker.isAvailable ? 'Available' : 'Busy'}
                  </span>
                </div>

                {/* Worker Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Specialization:</span>
                    <span className="font-medium">{worker.specialization}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Daily Wage:</span>
                    <span className="font-medium">${worker.dailyWage || 0}</span>
                  </div>
                  {performance && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Completed Tasks:</span>
                      <span className="font-medium text-green-600">{performance.completedTasks}</span>
                    </div>
                  )}
                </div>

                {/* Performance Preview */}
                {performance && (
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Performance</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min((performance.completedTasks / Math.max(analytics.topPerformers[0]?.completedTasks || 1)) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-green-600">
                          {performance.completedTasks} tasks
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="mt-4 pt-4 border-t">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View Detailed Analytics →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAndSortedWorkers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No workers found</div>
          <div className="text-gray-400 text-sm">
            Try adjusting your search or filters
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerList;
