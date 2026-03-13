import { useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import TaskCard from '../../components/TaskCard';
import { useAuth } from '../../context/AuthContext';
import invoiceService from '../../services/invoiceService';
import taskService from '../../services/taskService';
import workerService from '../../services/workerService';
<<<<<<< HEAD
import projectService from '../../services/projectService';
import materialRequestService from '../../services/materialRequestService';
import { formatINR } from '../../utils/currency';

// Tabs
const TABS = ['Overview', 'Manage Workers', 'Assign Tasks', 'Invoices', 'Material Requests', 'My Projects', 'Create Project'];
=======

// Tabs
const TABS = ['Overview', 'Manage Workers', 'Assign Tasks', 'Invoices'];
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69

const ContractorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [workers, setWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
<<<<<<< HEAD
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [materialRequests, setMaterialRequests] = useState([]);
=======
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69

  // Form States
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '', siteLocation: '' });
  const [newWorker, setNewWorker] = useState({ name: '', email: '', password: 'worker123', phone: '', dailyWage: '' });
  const [newInvoice, setNewInvoice] = useState({ title: '', amount: '', description: '', imageUrl: '' });
<<<<<<< HEAD
  const [newProject, setNewProject] = useState({ 
    projectId: '', 
    name: '', 
    projectType: '', 
    description: '', 
    startDate: '', 
    endDate: '', 
    status: 'planning', 
    location: '', 
    contractorDetails: '', 
    budget: '', 
    clientName: '',
    clientContact: '',
    estimatedDuration: '',
    priority: 'medium',
    materials: '',
    teamSize: '',
    permits: '',
    insurance: ''
  });
  const [salaryUpdate, setSalaryUpdate] = useState({ workerId: '', dailyWage: '' });
=======
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
<<<<<<< HEAD
      const [workersRes, tasksRes, invoicesRes, projectsRes, materialRequestsRes] = await Promise.all([
        workerService.getWorkers(),
        taskService.getTasks(),
        invoiceService.getInvoices(),
        projectService.getAll(),
        materialRequestService.getMaterialRequestsForContractor()
      ]);
      setWorkers(workersRes.data || workersRes); // handle pagination wrapper if exists
      setTasks(tasksRes.data || tasksRes);
      setInvoices(invoicesRes.data || invoicesRes);
      setProjects(projectsRes.data || projectsRes);
      setMaterialRequests(materialRequestsRes.data || materialRequestsRes);
=======
      const [workersRes, tasksRes, invoicesRes] = await Promise.all([
        workerService.getWorkers(),
        taskService.getTasks(),
        invoiceService.getInvoices()
      ]);
      setWorkers(workersRes.data || workersRes); // handle pagination wrapper if exists
      setTasks(tasksRes);
      setInvoices(invoicesRes);
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69
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

<<<<<<< HEAD
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await projectService.create(newProject);
      alert('Project Created Successfully!');
      setNewProject({ 
        projectId: '', 
        name: '', 
        projectType: '', 
        description: '', 
        startDate: '', 
        endDate: '', 
        status: 'planning', 
        location: '', 
        contractorDetails: '', 
        budget: '', 
        clientName: '',
        clientContact: '',
        estimatedDuration: '',
        priority: 'medium',
        materials: '',
        teamSize: '',
        permits: '',
        insurance: ''
      });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to create project');
    }
  };

  const handleUpdateSalary = async (e) => {
    e.preventDefault();
    if (!salaryUpdate.workerId || !salaryUpdate.dailyWage) {
      return alert('Please select a worker and enter a daily wage');
    }
    
    console.log('Sending salary update:', salaryUpdate);
    
    try {
      const response = await workerService.updateWorkerSalary(salaryUpdate);
      console.log('Salary update response:', response);
      alert('Worker Salary Updated Successfully!');
      setSalaryUpdate({ workerId: '', dailyWage: '' });
      fetchData();
    } catch (error) {
      console.error('Salary update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update worker salary';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleViewProjectDetails = (project) => {
    setSelectedProject(project);
    setIsEditingProject(false);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setIsEditingProject(true);
    setNewProject({
      projectId: project.projectId || '',
      name: project.name || '',
      projectType: project.projectType || '',
      description: project.description || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      status: project.status || 'planning',
      location: project.location || '',
      contractorDetails: project.contractorDetails || '',
      budget: project.budget || '',
      clientName: project.clientName || '',
      clientContact: project.clientContact || '',
      estimatedDuration: project.estimatedDuration || '',
      priority: project.priority || 'medium',
      materials: project.materials || '',
      teamSize: project.teamSize || '',
      permits: project.permits || '',
      insurance: project.insurance || ''
    });
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      await projectService.update(selectedProject._id, newProject);
      alert('Project Updated Successfully!');
      setSelectedProject(null);
      setIsEditingProject(false);
      setNewProject({ 
        projectId: '', 
        name: '', 
        projectType: '', 
        description: '', 
        startDate: '', 
        endDate: '', 
        status: 'planning', 
        location: '', 
        contractorDetails: '', 
        budget: '', 
        clientName: '',
        clientContact: '',
        estimatedDuration: '',
        priority: 'medium',
        materials: '',
        teamSize: '',
        permits: '',
        insurance: ''
      });
      fetchData();
    } catch (error) {
      console.error('Project update error:', error);
      alert('Failed to update project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await projectService.delete(projectId);
        alert('Project Deleted Successfully!');
        fetchData();
      } catch (error) {
        console.error('Project delete error:', error);
        alert('Failed to delete project');
      }
    }
  };

  const handleUpdateMaterialRequestStatus = async (requestId, status) => {
    try {
      await materialRequestService.updateMaterialRequestStatus(requestId, { status });
      alert(`Request ${status} successfully!`);
      fetchData();
    } catch (error) {
      console.error('Material request update error:', error);
      alert('Failed to update request status');
    }
  };

=======
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69
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
<<<<<<< HEAD
                  type="number" placeholder="Daily Wage (₹)" 
=======
                  type="number" placeholder="Daily Wage ($)" 
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69
                  value={newWorker.dailyWage} onChange={e => setNewWorker({...newWorker, dailyWage: e.target.value})}
                />
                <button type="submit" className="btn btn-primary w-full">Enable Worker Account</button>
              </form>
            </div>

            {/* Workers List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your Workforce</h2>
<<<<<<< HEAD
              
              {/* Salary Update Form */}
              <div className="glass-card p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Update Worker Salary</h3>
                <form onSubmit={handleUpdateSalary} className="flex gap-3">
                  <select 
                    value={salaryUpdate.workerId} 
                    onChange={e => setSalaryUpdate({...salaryUpdate, workerId: e.target.value})}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Worker</option>
                    {workers && workers.map(worker => (
                      <option key={worker._id} value={worker._id}>
                        {worker.name} - Current: {formatINR(worker.dailyWage || 0)}
                      </option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    placeholder="New Daily Wage (₹)" 
                    value={salaryUpdate.dailyWage} 
                    onChange={e => setSalaryUpdate({...salaryUpdate, dailyWage: e.target.value})}
                    className="w-48 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <button type="submit" className="btn btn-primary">Update Salary</button>
                </form>
              </div>

              {(!workers || workers.length === 0) && <p className="text-gray-500">No workers found.</p>}
              {workers && workers.map(worker => (
=======
              {workers.length === 0 && <p className="text-gray-500">No workers found.</p>}
              {workers.map(worker => (
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69
                <div key={worker._id} className="glass-panel p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{worker.name}</h4>
                      <p className="text-sm text-gray-500">{worker.phone} • {worker.email}</p>
<<<<<<< HEAD
                      <p className="text-sm text-gray-600">Daily Wage: {formatINR(worker.dailyWage || 0)}</p>
=======
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69
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
<<<<<<< HEAD
                  {workers && workers.map(w => (
=======
                  {workers.map(w => (
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69
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
<<<<<<< HEAD
               {(!tasks || tasks.length === 0) && <p className="col-span-full text-gray-500">No tasks created yet.</p>}
               {tasks && tasks.map(task => (
=======
               {tasks.length === 0 && <p className="col-span-full text-gray-500">No tasks created yet.</p>}
               {tasks.map(task => (
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69
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
<<<<<<< HEAD
                  type="number" placeholder="Amount (₹)" 
=======
                  type="number" placeholder="Amount ($)" 
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69
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
<<<<<<< HEAD
              {(!invoices || invoices.length === 0) && <p className="text-gray-500">No invoices submitted.</p>}
              {invoices && invoices.map(invoice => (
=======
              {invoices.length === 0 && <p className="text-gray-500">No invoices submitted.</p>}
              {invoices.map(invoice => (
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69
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
<<<<<<< HEAD
                    <span className="block text-xl font-bold text-gray-900">{formatINR(invoice.amount)}</span>
=======
                    <span className="block text-xl font-bold text-gray-900">${invoice.amount}</span>
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69
                    <span className="text-xs text-gray-500">{new Date(invoice.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

<<<<<<< HEAD
        {/* MY PROJECTS TAB */}
        {activeTab === 'My Projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">My Projects</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('Create Project')}
                  className="btn btn-primary"
                >
                  + Create New Project
                </button>
              </div>
            </div>

            {/* Project Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {projects.filter(p => p.status === 'planning').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Planning</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Active</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {projects.filter(p => p.status === 'on-hold').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">On Hold</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {projects.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Completed</div>
              </div>
            </div>

            {/* Projects List */}
            {(!projects || projects.length === 0) ? (
              <div className="glass-card p-12 text-center">
                <div className="text-gray-400 text-lg mb-4">No projects found</div>
                <p className="text-gray-500 mb-6">Create your first project to get started</p>
                <button 
                  onClick={() => setActiveTab('Create Project')}
                  className="btn btn-primary"
                >
                  Create Your First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects && projects.map(project => (
                  <div key={project._id} className="glass-card p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-gray-800">{project.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        project.status === 'planning' ? 'bg-blue-100 text-blue-600' :
                        project.status === 'active' ? 'bg-green-100 text-green-600' :
                        project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-600' :
                        project.status === 'completed' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </div>

                    {project.projectId && (
                      <div className="text-sm text-gray-500 mb-2">ID: {project.projectId}</div>
                    )}

                    {project.projectType && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Type:</span> {project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1)}
                      </div>
                    )}

                    {project.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                    )}

                    <div className="space-y-2 text-sm">
                      {project.location && (
                        <div className="flex items-center text-gray-600">
                          <span className="font-medium mr-2">📍:</span>
                          <span className="truncate">{project.location}</span>
                        </div>
                      )}

                      {project.startDate && (
                        <div className="flex items-center text-gray-600">
                          <span className="font-medium mr-2">📅:</span>
                          <span>{new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      {project.endDate && (
                        <div className="flex items-center text-gray-600">
                          <span className="font-medium mr-2">⏳:</span>
                          <span>{new Date(project.endDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      {project.budget && (
                        <div className="flex items-center text-gray-600">
                          <span className="font-medium mr-2">💰:</span>
                          <span className="font-bold text-green-600">{formatINR(project.budget)}</span>
                        </div>
                      )}

                      {project.clientName && (
                        <div className="flex items-center text-gray-600">
                          <span className="font-medium mr-2">👥:</span>
                          <span>{project.clientName}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <button 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={() => handleViewProjectDetails(project)}
                      >
                        View Details
                      </button>
                      <div className="flex gap-2">
                        <button 
                          className="text-gray-600 hover:text-gray-800 text-sm"
                          onClick={() => handleEditProject(project)}
                        >
                          Edit
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800 text-sm"
                          onClick={() => handleDeleteProject(project._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MATERIAL REQUESTS TAB */}
        {activeTab === 'Material Requests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Material Requests to Fulfill</h2>
              <div className="text-sm text-gray-500">
                {materialRequests.filter(req => req.status === 'approved' || req.status === 'ordered').length} pending requests
              </div>
            </div>

            {(!materialRequests || materialRequests.length === 0) ? (
              <div className="glass-card p-12 text-center">
                <div className="text-gray-400 text-lg mb-4">No material requests assigned</div>
                <p className="text-gray-500">Site managers will assign material requests to you here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {materialRequests && materialRequests.map(request => (
                  <div key={request._id} className="glass-card p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{request.title}</h3>
                        <p className="text-sm text-gray-500">
                          Requested by: {request.siteManager?.name} • {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        request.status === 'approved' ? 'bg-blue-100 text-blue-600' :
                        request.status === 'ordered' ? 'bg-purple-100 text-purple-600' :
                        request.status === 'delivered' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-600">Material Type:</span>
                        <span className="font-medium">{request.materialType?.replace('_', ' ').charAt(0).toUpperCase() + request.materialType?.replace('_', ' ').slice(1)}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <span className="font-medium">{request.quantity} {request.unit}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-600">Urgency:</span>
                        <span className={`font-medium ${
                          request.urgency === 'urgent' ? 'text-red-600' :
                          request.urgency === 'high' ? 'text-orange-600' :
                          request.urgency === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {request.urgency?.charAt(0).toUpperCase() + request.urgency?.slice(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Project:</span>
                        <span className="font-medium">{request.project?.name || 'N/A'}</span>
                      </div>
                    </div>

                    {request.description && (
                      <div className="mb-4">
                        <span className="text-sm text-gray-600">Description:</span>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded mt-1">{request.description}</p>
                      </div>
                    )}

                    {request.estimatedDelivery && (
                      <div className="mb-4">
                        <span className="text-sm text-gray-600">Estimated Delivery:</span>
                        <span className="font-medium">{new Date(request.estimatedDelivery).toLocaleDateString()}</span>
                      </div>
                    )}

                    {request.budget && (
                      <div className="mb-4">
                        <span className="text-sm text-gray-600">Budget:</span>
                        <span className="font-bold text-green-600">{formatINR(request.budget)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Request for: {request.requestedBy?.name}
                      </div>
                      <div className="flex gap-2">
                        {request.status === 'approved' && (
                          <button 
                            onClick={() => handleUpdateMaterialRequestStatus(request._id, 'ordered')}
                            className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                          >
                            Mark Ordered
                          </button>
                        )}
                        {request.status === 'ordered' && (
                          <button 
                            onClick={() => handleUpdateMaterialRequestStatus(request._id, 'delivered')}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {request.status === 'delivered' && (
                          <button 
                            onClick={() => handleUpdateMaterialRequestStatus(request._id, 'completed')}
                            className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE PROJECT TAB */}
        {activeTab === 'Create Project' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
             <div className="xl:col-span-2 glass-card h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Create New Construction Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-6">
                
                {/* Project Identification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project ID *</label>
                    <input 
                      type="text" 
                      placeholder="e.g., PROJ-2024-001" 
                      value={newProject.projectId} 
                      onChange={e => setNewProject({...newProject, projectId: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Commercial Building Construction" 
                      value={newProject.name} 
                      onChange={e => setNewProject({...newProject, name: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Type *</label>
                    <select 
                      value={newProject.projectType} 
                      onChange={e => setNewProject({...newProject, projectType: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Project Type</option>
                      <option value="residential">Residential Building</option>
                      <option value="commercial">Commercial Building</option>
                      <option value="industrial">Industrial Construction</option>
                      <option value="infrastructure">Infrastructure</option>
                      <option value="renovation">Renovation</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                    <select 
                      value={newProject.priority} 
                      onChange={e => setNewProject({...newProject, priority: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Project Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Description *</label>
                  <textarea 
                    placeholder="Detailed project description including scope, objectives, and key deliverables..." 
                    rows="4"
                    value={newProject.description} 
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  ></textarea>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <input 
                      type="date" 
                      value={newProject.startDate} 
                      onChange={e => setNewProject({...newProject, startDate: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                    <input 
                      type="date" 
                      value={newProject.endDate} 
                      onChange={e => setNewProject({...newProject, endDate: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration</label>
                    <input 
                      type="text" 
                      placeholder="e.g., 6 months" 
                      value={newProject.estimatedDuration} 
                      onChange={e => setNewProject({...newProject, estimatedDuration: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Location and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Location *</label>
                    <input 
                      type="text" 
                      placeholder="e.g., 123 Main Street, City, State" 
                      value={newProject.location} 
                      onChange={e => setNewProject({...newProject, location: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Status *</label>
                    <select 
                      value={newProject.status} 
                      onChange={e => setNewProject({...newProject, status: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Budget Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Budget (₹) *</label>
                      <input 
                        type="number" 
                        placeholder="e.g., 5000000" 
                        value={newProject.budget} 
                        onChange={e => setNewProject({...newProject, budget: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Materials Cost (₹)</label>
                      <input 
                        type="number" 
                        placeholder="e.g., 2000000" 
                        value={newProject.materials} 
                        onChange={e => setNewProject({...newProject, materials: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Client Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Client Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
                      <input 
                        type="text" 
                        placeholder="e.g., ABC Corporation" 
                        value={newProject.clientName} 
                        onChange={e => setNewProject({...newProject, clientName: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client Contact *</label>
                      <input 
                        type="text" 
                        placeholder="e.g., +91 98765 43210" 
                        value={newProject.clientContact} 
                        onChange={e => setNewProject({...newProject, clientContact: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contractor Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Contractor Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contractor Details</label>
                      <textarea 
                        placeholder="Company name, license number, specializations..." 
                        rows="3"
                        value={newProject.contractorDetails} 
                        onChange={e => setNewProject({...newProject, contractorDetails: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Team Size</label>
                      <input 
                        type="number" 
                        placeholder="e.g., 25" 
                        value={newProject.teamSize} 
                        onChange={e => setNewProject({...newProject, teamSize: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Legal & Compliance */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Legal & Compliance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Permits Required</label>
                      <textarea 
                        placeholder="Building permits, environmental clearances, etc." 
                        rows="2"
                        value={newProject.permits} 
                        onChange={e => setNewProject({...newProject, permits: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Coverage</label>
                      <textarea 
                        placeholder="Liability insurance, worker's compensation, etc." 
                        rows="2"
                        value={newProject.insurance} 
                        onChange={e => setNewProject({...newProject, insurance: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full py-3 text-lg font-semibold">Create Project</button>
              </form>
            </div>

            <div className="glass-card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Project Creation Guidelines</h2>
              <div className="space-y-4 text-gray-600">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">📋 Project Identification</h3>
                  <p className="text-sm">Assign a unique Project ID for tracking. Use a clear project name that reflects the nature and scope of work.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">🏗️ Project Type & Priority</h3>
                  <p className="text-sm">Select the appropriate project type and priority level to help with resource allocation and scheduling.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">📝 Detailed Description</h3>
                  <p className="text-sm">Provide comprehensive project details including scope, objectives, technical specifications, and key deliverables.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">📅 Timeline Planning</h3>
                  <p className="text-sm">Set realistic start and end dates. Consider dependencies, weather conditions, and potential delays when estimating duration.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">📍 Location & Status</h3>
                  <p className="text-sm">Provide accurate project location with complete address details. Keep status updated to reflect actual progress.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">💰 Budget Information</h3>
                  <p className="text-sm">Allocate comprehensive budget including materials, labor, equipment, and contingency costs. All amounts in Indian Rupees (₹).</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">� Client Information</h3>
                  <p className="text-sm">Maintain accurate client details including contact information for effective communication and billing.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">🔧 Contractor Details</h3>
                  <p className="text-sm">Include company information, licensing details, specializations, and team size for project documentation.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">⚖️ Legal & Compliance</h3>
                  <p className="text-sm">Document all required permits and insurance coverage to ensure regulatory compliance and risk management.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROJECT DETAILS MODAL */}
        {selectedProject && !isEditingProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Project Details</h2>
                  <button 
                    onClick={() => setSelectedProject(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Project Information */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Project Information</h3>
                      <div className="space-y-2">
                        <div><span className="font-medium">Project ID:</span> {selectedProject.projectId || 'N/A'}</div>
                        <div><span className="font-medium">Name:</span> {selectedProject.name}</div>
                        <div><span className="font-medium">Type:</span> {selectedProject.projectType?.charAt(0).toUpperCase() + selectedProject.projectType?.slice(1) || 'N/A'}</div>
                        <div><span className="font-medium">Status:</span> 
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            selectedProject.status === 'planning' ? 'bg-blue-100 text-blue-600' :
                            selectedProject.status === 'active' ? 'bg-green-100 text-green-600' :
                            selectedProject.status === 'on-hold' ? 'bg-yellow-100 text-yellow-600' :
                            selectedProject.status === 'completed' ? 'bg-purple-100 text-purple-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {selectedProject.status?.charAt(0).toUpperCase() + selectedProject.status?.slice(1)}
                          </span>
                        </div>
                        <div><span className="font-medium">Priority:</span> {selectedProject.priority?.charAt(0).toUpperCase() + selectedProject.priority?.slice(1) || 'N/A'}</div>
                        <div><span className="font-medium">Location:</span> {selectedProject.location || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Timeline</h3>
                      <div className="space-y-2">
                        <div><span className="font-medium">Start Date:</span> {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'N/A'}</div>
                        <div><span className="font-medium">End Date:</span> {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'N/A'}</div>
                        <div><span className="font-medium">Duration:</span> {selectedProject.estimatedDuration || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Budget & Client */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Budget Information</h3>
                        <div className="space-y-2">
                          <div><span className="font-medium">Total Budget:</span> <span className="text-green-600 font-bold">{formatINR(selectedProject.budget || 0)}</span></div>
                          <div><span className="font-medium">Materials Cost:</span> <span className="text-blue-600 font-bold">{formatINR(selectedProject.materials || 0)}</span></div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Client Information</h3>
                        <div className="space-y-2">
                          <div><span className="font-medium">Client Name:</span> {selectedProject.clientName || 'N/A'}</div>
                          <div><span className="font-medium">Contact:</span> {selectedProject.clientContact || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Description */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{selectedProject.description || 'No description available'}</p>
                  </div>

                  {/* Contractor & Legal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Contractor Information</h3>
                      <div className="space-y-2">
                        <div><span className="font-medium">Team Size:</span> {selectedProject.teamSize || 'N/A'}</div>
                        <div><span className="font-medium">Details:</span> {selectedProject.contractorDetails || 'N/A'}</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Legal & Compliance</h3>
                      <div className="space-y-2">
                        <div><span className="font-medium">Permits:</span> {selectedProject.permits || 'N/A'}</div>
                        <div><span className="font-medium">Insurance:</span> {selectedProject.insurance || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    onClick={() => handleEditProject(selectedProject)}
                    className="btn btn-primary"
                  >
                    Edit Project
                  </button>
                  <button 
                    onClick={() => setSelectedProject(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDIT PROJECT MODAL */}
        {selectedProject && isEditingProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Edit Project</h2>
                  <button 
                    onClick={() => {
                      setSelectedProject(null);
                      setIsEditingProject(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleUpdateProject} className="space-y-6">
                  {/* Reuse the same form structure as create project */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project ID</label>
                      <input 
                        type="text" 
                        value={newProject.projectId} 
                        onChange={e => setNewProject({...newProject, projectId: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                      <input 
                        type="text" 
                        value={newProject.name} 
                        onChange={e => setNewProject({...newProject, name: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
                      <select 
                        value={newProject.projectType} 
                        onChange={e => setNewProject({...newProject, projectType: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select Project Type</option>
                        <option value="residential">Residential Building</option>
                        <option value="commercial">Commercial Building</option>
                        <option value="industrial">Industrial Construction</option>
                        <option value="infrastructure">Infrastructure</option>
                        <option value="renovation">Renovation</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select 
                        value={newProject.priority} 
                        onChange={e => setNewProject({...newProject, priority: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                    <textarea 
                      placeholder="Detailed project description including scope, objectives, and key deliverables..." 
                      rows="4"
                      value={newProject.description} 
                      onChange={e => setNewProject({...newProject, description: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input 
                        type="date" 
                        value={newProject.startDate} 
                        onChange={e => setNewProject({...newProject, startDate: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input 
                        type="date" 
                        value={newProject.endDate} 
                        onChange={e => setNewProject({...newProject, endDate: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration</label>
                      <input 
                        type="text" 
                        placeholder="e.g., 6 months" 
                        value={newProject.estimatedDuration} 
                        onChange={e => setNewProject({...newProject, estimatedDuration: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Location</label>
                      <input 
                        type="text" 
                        placeholder="e.g., 123 Main Street, City, State" 
                        value={newProject.location} 
                        onChange={e => setNewProject({...newProject, location: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Status</label>
                      <select 
                        value={newProject.status} 
                        onChange={e => setNewProject({...newProject, status: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Budget (₹)</label>
                      <input 
                        type="number" 
                        placeholder="e.g., 5000000" 
                        value={newProject.budget} 
                        onChange={e => setNewProject({...newProject, budget: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Materials Cost (₹)</label>
                      <input 
                        type="number" 
                        placeholder="e.g., 2000000" 
                        value={newProject.materials} 
                        onChange={e => setNewProject({...newProject, materials: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g., ABC Corporation" 
                        value={newProject.clientName} 
                        onChange={e => setNewProject({...newProject, clientName: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client Contact</label>
                      <input 
                        type="text" 
                        placeholder="e.g., +91 98765 43210" 
                        value={newProject.clientContact} 
                        onChange={e => setNewProject({...newProject, clientContact: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contractor Details</label>
                      <textarea 
                        placeholder="Company name, license number, specializations..." 
                        rows="3"
                        value={newProject.contractorDetails} 
                        onChange={e => setNewProject({...newProject, contractorDetails: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Team Size</label>
                      <input 
                        type="number" 
                        placeholder="e.g., 25" 
                        value={newProject.teamSize} 
                        onChange={e => setNewProject({...newProject, teamSize: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Permits Required</label>
                      <textarea 
                        placeholder="Building permits, environmental clearances, etc." 
                        rows="2"
                        value={newProject.permits} 
                        onChange={e => setNewProject({...newProject, permits: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Coverage</label>
                      <textarea 
                        placeholder="Liability insurance, worker's compensation, etc." 
                        rows="2"
                        value={newProject.insurance} 
                        onChange={e => setNewProject({...newProject, insurance: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button 
                      type="submit"
                      className="btn btn-primary"
                    >
                      Update Project
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedProject(null);
                        setIsEditingProject(false);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

=======
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69
      </div>
    </div>
  );
};

export default ContractorDashboard;
