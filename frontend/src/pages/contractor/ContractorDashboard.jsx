import { useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import TaskCard from '../../components/TaskCard';
import { useAuth } from '../../context/AuthContext';
import invoiceService from '../../services/invoiceService';
import taskService from '../../services/taskService';
import workerService from '../../services/workerService';

// Tabs
const TABS = ['Overview', 'Manage Workers', 'Assign Tasks', 'Invoices'];

const ContractorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [workers, setWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Form States
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '', siteLocation: '' });
  const [newWorker, setNewWorker] = useState({ name: '', email: '', password: 'worker123', phone: '', dailyWage: '' });
  const [newInvoice, setNewInvoice] = useState({ title: '', amount: '', description: '', imageUrl: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workersRes, tasksRes, invoicesRes] = await Promise.all([
        workerService.getWorkers(),
        taskService.getTasks(),
        invoiceService.getInvoices()
      ]);
      setWorkers(workersRes.data || workersRes); // handle pagination wrapper if exists
      setTasks(tasksRes);
      setInvoices(invoicesRes);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskService.createTask(newTask);
      alert('Task Assigned Successfully!');
      setNewTask({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '', siteLocation: '' });
      fetchData(); // Refresh
    } catch (error) {
      console.error(error);
      alert('Failed to create task');
    }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      await workerService.addWorker(newWorker);
      alert('Worker Added Successfully!');
      setNewWorker({ name: '', email: '', password: 'worker123', phone: '', dailyWage: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to add worker');
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!newInvoice.imageUrl) return alert('Please provide an image URL');
    try {
      await invoiceService.createInvoice({ ...newInvoice, projectId: user.projectId || '60d0fe4f5311236168a109ca' }); // Mock project ID fallback
      alert('Invoice Uploaded!');
      setNewInvoice({ title: '', amount: '', description: '', imageUrl: '' });
      fetchData();
    } catch (error) {
       console.error(error);
       alert('Failed to upload invoice');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader /></div>;

  return (
    <div className="min-h-screen p-6 pb-20">
      <header className="mb-8 flex justify-between items-center animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Contractor Hub</h1>
          <p className="text-gray-500">Manage your workforce and projects efficiently.</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="animate-fade-in">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6">
              <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">Total Workers</h3>
              <p className="text-4xl font-bold text-gray-900">{workers.length || 0}</p>
            </div>
            <div className="glass-panel p-6">
              <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">Active Tasks</h3>
              <p className="text-4xl font-bold text-blue-600">{tasks.filter(t => t.status !== 'Completed').length}</p>
            </div>
            <div className="glass-panel p-6">
              <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">Pending Invoices</h3>
              <p className="text-4xl font-bold text-amber-500">{invoices.filter(i => i.status === 'Pending').length}</p>
            </div>
          </div>
        )}

        {/* MANAGE WORKERS TAB */}
        {activeTab === 'Manage Workers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add Worker Form */}
            <div className="glass-card lg:col-span-1 h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Worker</h2>
              <form onSubmit={handleAddWorker} className="flex flex-col gap-4">
                <input 
                  type="text" placeholder="Full Name" 
                  value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})}
                  required 
                />
                <input 
                  type="email" placeholder="Email Address" 
                  value={newWorker.email} onChange={e => setNewWorker({...newWorker, email: e.target.value})}
                  required 
                />
                <input 
                  type="text" placeholder="Phone Number" 
                  value={newWorker.phone} onChange={e => setNewWorker({...newWorker, phone: e.target.value})}
                  required 
                />
                <input 
                  type="number" placeholder="Daily Wage ($)" 
                  value={newWorker.dailyWage} onChange={e => setNewWorker({...newWorker, dailyWage: e.target.value})}
                />
                <button type="submit" className="btn btn-primary w-full">Enable Worker Account</button>
              </form>
            </div>

            {/* Workers List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your Workforce</h2>
              {workers.length === 0 && <p className="text-gray-500">No workers found.</p>}
              {workers.map(worker => (
                <div key={worker._id} className="glass-panel p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{worker.name}</h4>
                      <p className="text-sm text-gray-500">{worker.phone} • {worker.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-semibold text-emerald-600">Active</span>
                    <span className="text-xs text-gray-400">Role: Worker</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ASSIGN TASKS TAB */}
        {activeTab === 'Assign Tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="glass-card lg:col-span-1 h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Assign New Task</h2>
              <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
                <input 
                  type="text" placeholder="Task Title" 
                  value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                  required 
                />
                <textarea 
                  placeholder="Detailed Description" rows="3"
                  value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}
                  required 
                ></textarea>
                <select 
                  value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}
                  required
                  className="bg-white border-gray-300 text-gray-900"
                >
                  <option value="">Select Worker</option>
                  {workers.map(w => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                  <input 
                    type="date" 
                    value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
                 <input 
                  type="text" placeholder="Site Location / Zone" 
                  value={newTask.siteLocation} onChange={e => setNewTask({...newTask, siteLocation: e.target.value})}
                  required 
                />
                <button type="submit" className="btn btn-primary w-full">Assign Task</button>
              </form>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
               {tasks.length === 0 && <p className="col-span-full text-gray-500">No tasks created yet.</p>}
               {tasks.map(task => (
                 <TaskCard key={task._id} task={task} onUpdateStatus={() => {}} />
               ))}
            </div>
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === 'Invoices' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="glass-card lg:col-span-1 h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Submit Invoice</h2>
              <form onSubmit={handleCreateInvoice} className="flex flex-col gap-4">
                <input 
                  type="text" placeholder="Invoice Title / Reference" 
                  value={newInvoice.title} onChange={e => setNewInvoice({...newInvoice, title: e.target.value})}
                  required 
                />
                 <input 
                  type="number" placeholder="Amount ($)" 
                  value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})}
                  required 
                />
                <input 
                  type="text" placeholder="Image URL (e.g. from cloud storage)" 
                  value={newInvoice.imageUrl} onChange={e => setNewInvoice({...newInvoice, imageUrl: e.target.value})}
                  required 
                />
                 <textarea 
                  placeholder="Additional Notes" rows="2"
                  value={newInvoice.description} onChange={e => setNewInvoice({...newInvoice, description: e.target.value})}
                ></textarea>
                <button type="submit" className="btn btn-primary w-full">Upload Invoice</button>
              </form>
            </div>

             <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Invoice History</h2>
              {invoices.length === 0 && <p className="text-gray-500">No invoices submitted.</p>}
              {invoices.map(invoice => (
                <div key={invoice._id} className="glass-panel p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">{invoice.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      invoice.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 
                      invoice.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-bold text-gray-900">${invoice.amount}</span>
                    <span className="text-xs text-gray-500">{new Date(invoice.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ContractorDashboard;
