import { useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import TaskCard from '../../components/TaskCard';
import Notifications from '../../components/Notifications';
import { useAuth } from '../../context/AuthContext';
import taskService from '../../services/taskService';

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
      // Don't show error immediately if it's just empty, but here it's likely auth or server error
      setError('Failed to fetch tasks'); 
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, currentStatus) => {
    // Simple toggle logic for demo: Pending -> In Progress -> Completed
    let newStatus = 'Pending';
    if (currentStatus === 'Pending') newStatus = 'In Progress';
    else if (currentStatus === 'In Progress') newStatus = 'Completed';
    
    if (currentStatus === 'Completed') return; 

    try {
      await taskService.updateTask(taskId, { status: newStatus });
      fetchTasks(); // Refresh to ensure sync
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader />
    </div>
  );

  // Calculate stats
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const completedCount = tasks.filter(t => t.status === 'Completed' || t.status === 'Verified').length;
  // Wage calculation (mock for now)
  const todayWage = user?.dailyWage || 0; 

  return (
    <div className="min-h-screen p-6 pb-20">
      {/* Header Section */}
      <header className="mb-8 animate-fade-in">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, <span className="text-blue-600">{user?.name}</span>
            </h1>
            <p className="text-gray-500">Here's your schedule for today.</p>
          </div>
          <Notifications />
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-in">
        <div className="glass-panel p-4 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-gray-900 mb-1">{pendingCount}</span>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Tasks Pending</span>
        </div>
        <div className="glass-panel p-4 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-emerald-600 mb-1">{completedCount}</span>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Completed</span>
        </div>
        <div className="glass-panel p-4 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-amber-500 mb-1">${todayWage}</span>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Daily Wage</span>
        </div>
         <div className="glass-panel p-4 flex flex-col items-center justify-center text-center border-blue-100 border">
          <span className="text-3xl font-bold text-blue-600 mb-1">98%</span>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Attendance</span>
        </div>
      </div>

      {/* Tasks Section */}
      <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-bold text-gray-900">Assigned Tasks</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            View All History
          </button>
        </div>

        {error && <div className="text-red-600 mb-4 bg-red-50 p-3 rounded">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskCard 
                key={task._id} 
                task={task} 
                onUpdateStatus={(id) => handleUpdateStatus(id, task.status)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500 glass-panel">
              <p>No tasks assigned yet.</p>
              <p className="text-sm mt-2">You'll receive notifications here when new tasks are assigned to you.</p>
            </div>
          )}
        </div>
      </section>

      {/* Notifications Section */}
      <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Notifications</h3>
          <div className="text-center text-gray-500 py-4">
            <p>Check the notification bell 🔔 at the top right for real-time updates</p>
            <p className="text-sm mt-2">You'll be notified whenever someone assigns you a new task!</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WorkerDashboard;
