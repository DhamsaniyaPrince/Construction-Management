import { useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import { blueprintService } from '../../services/blueprintService';
import { projectService } from "../../services/projectService";
import { taskService } from '../../services/taskService'; // To approve/inspect tasks
import { materialRequestService } from '../../services/materialRequestService';

const TABS = ['Overview', 'Blueprints', 'Material Approvals', 'Site Inspections'];

const EngineerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(false);

  // Status badge helper
  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING_ENGINEER_APPROVAL': 'bg-yellow-100 text-yellow-800',
      'PENDING_CONTRACTOR_APPROVAL': 'bg-orange-100 text-orange-800',
      'ENGINEER_APPROVED': 'bg-blue-100 text-blue-800',
      'ENGINEER_REJECTED': 'bg-red-100 text-red-800',
      'CONTRACTOR_APPROVED': 'bg-green-100 text-green-800',
      'CONTRACTOR_REJECTED': 'bg-red-100 text-red-800',
      'PURCHASED': 'bg-purple-100 text-purple-800',
      'DELIVERED': 'bg-green-100 text-green-800'
    };
    
    const displayStatus = status.replace(/_/g, ' ');
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {displayStatus}
      </span>
    );
  };

  // Data
  const [projects, setProjects] = useState([]);
  const [blueprints, setBlueprints] = useState([]);
  const [tasksToCheck, setTasksToCheck] = useState([]); // Tasks needing inspection
  const [materialRequests, setMaterialRequests] = useState([]); // Material requests needing approval

  // Forms
  const [newBlueprint, setNewBlueprint] = useState({ title: '', version: '1.0', imageUrl: '', projectId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log("Projects state updated:", projects);
    console.log("Projects length:", projects?.length);
  }, [projects]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, blueprintsRes, tasksRes, materialRequestsRes] = await Promise.all([
        projectService.getProjects(), // Backend will filter by role
        blueprintService.getBlueprints(),
        taskService.getTasks(),
        materialRequestService.getEngineerMaterialRequests() // Use specific engineer endpoint
      ]);
      
      console.log('Projects Response:', projectsRes);
      console.log('Projects type:', typeof projectsRes);
      console.log('Is array:', Array.isArray(projectsRes));
      console.log('Projects length:', projectsRes?.length);
      
      setProjects(Array.isArray(projectsRes) ? projectsRes : []);
      setBlueprints(blueprintsRes);
      // Filter for 'Completed' status which needs verification
      setTasksToCheck(tasksRes.filter(t => t.status === 'Completed'));
      setMaterialRequests(materialRequestsRes.data || []);
      console.log('Set Material Requests:', materialRequestsRes.data || []);
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEngineerApproval = async (requestId, approved, comments = '') => {
    try {
      await materialRequestService.engineerApproval(requestId, { approved, comments });
      alert(`Material request ${approved ? 'approved' : 'rejected'} successfully!`);
      fetchData();
    } catch (error) {
      console.error('Engineer approval error:', error);
      const errorMessage = error?.response?.data?.message || 
                           error?.response?.data?.error || 
                           error?.message || 
                           'Failed to process approval';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleUploadBlueprint = async (e) => {
    e.preventDefault();
    try {
      if (!newBlueprint.projectId) return alert('Select a project');
      await blueprintService.uploadBlueprint(newBlueprint);
      alert('Blueprint Uploaded!');
      setNewBlueprint({ title: '', version: '1.0', imageUrl: '', projectId: '' });
      fetchData();
    } catch (error) {
       console.error(error);
       alert('Upload failed');
    }
  };

  const handleVerifyTask = async (taskId) => {
    try {
      await taskService.updateTask(taskId, { status: 'Verified' });
      alert('Task Verified!');
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader /></div>;

  return (
    <div className="min-h-screen p-6 pb-20">
      <header className="mb-8 flex justify-between items-center animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Engineering Control</h1>
          <p className="text-gray-500">Project Planning & Quality Assurance.</p>
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

       <div className="animate-fade-in">
         {/* OVERVIEW */}
         {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6">
              <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">Active Projects</h3>
              <p className="text-4xl font-bold text-gray-900">{projects.length}</p>
            </div>
            <div className="glass-panel p-6">
              <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">Pending Inspections</h3>
              <p className="text-4xl font-bold text-amber-500">{tasksToCheck.length}</p>
            </div>
             <div className="glass-panel p-6">
              <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">Total Drawings</h3>
              <p className="text-4xl font-bold text-blue-600">{blueprints.length}</p>
            </div>
          </div>
         )}

         {/* BLUEPRINTS */}
         {activeTab === 'Blueprints' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="glass-card lg:col-span-1 h-fit">
               <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Drawing</h2>
               <form onSubmit={handleUploadBlueprint} className="flex flex-col gap-4">
                 <select 
                   value={newBlueprint.projectId} onChange={e => setNewBlueprint({...newBlueprint, projectId: e.target.value})}
                   required
                   className="bg-white border-gray-300 text-gray-900"
                 >
                   <option value="">Select Project</option>
                   {projects.map(p => (
                     <option key={p._id} value={p._id}>{p.name}</option>
                   ))}
                 </select>
                 <input 
                   type="text" placeholder="Drawing Title" 
                   value={newBlueprint.title} onChange={e => setNewBlueprint({...newBlueprint, title: e.target.value})}
                   required 
                 />
                 <input 
                   type="text" placeholder="Version (e.g. 1.0)" 
                   value={newBlueprint.version} onChange={e => setNewBlueprint({...newBlueprint, version: e.target.value})}
                   required 
                 />
                 <input 
                   type="text" placeholder="Image URL" 
                   value={newBlueprint.imageUrl} onChange={e => setNewBlueprint({...newBlueprint, imageUrl: e.target.value})}
                   required 
                 />
                 <button type="submit" className="btn btn-primary w-full">Upload Blueprint</button>
               </form>
             </div>

             <div className="lg:col-span-2 space-y-4">
               <h2 className="text-xl font-bold text-gray-800 mb-4">Project Drawings</h2>
               {blueprints.length === 0 && <p className="text-gray-500">No blueprints uploaded.</p>}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {blueprints.map(bp => (
                   <div key={bp._id} className="glass-card p-0 overflow-hidden group border border-gray-200">
                     <div className="h-40 bg-gray-100 relative text-gray-400">
                       {/* Placeholder for real image since we are using URLs */}
                       <div className="w-full h-full flex items-center justify-center">
                         {bp.imageUrl ? <span className="text-xs truncate max-w-[80%] px-2">{bp.imageUrl}</span> : 'No Preview'}
                       </div>
                       <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs text-gray-700 shadow-sm">v{bp.version}</div>
                     </div>
                     <div className="p-4">
                       <h4 className="font-bold text-gray-900">{bp.title}</h4>
                       <p className="text-xs text-gray-500 mb-2">{bp.project?.name || 'Unknown Project'}</p>
                       <p className="text-xs text-gray-400">Uploaded by {bp.uploadedBy?.name}</p>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         )}

         {/* MATERIAL APPROVALS */}
         {activeTab === 'Material Approvals' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">Material Requests Pending Technical Review</h2>
            {materialRequests.length === 0 && <p className="text-gray-500">No pending material requests.</p>}
            <div className="space-y-4">
              {materialRequests.map(request => (
                <div key={request._id} className="glass-card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{request.materialName}</h3>
                      <p className="text-sm text-gray-500">
                        Requested by: {request.requestedBy?.name} • {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Project: {request.projectId?.name || 'N/A'}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-600">Material:</span>
                      <span className="font-medium">{request.materialName}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Quantity:</span>
                      <span className="font-medium">{request.quantity} {request.unit}</span>
                    </div>
                  </div>

                  {request.description && (
                    <div className="mb-4">
                      <span className="text-sm text-gray-600">Description:</span>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded mt-1">{request.description}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Status: <span className="font-medium">{request.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEngineerApproval(request._id, true)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleEngineerApproval(request._id, false)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

         {/* SITE INSPECTIONS */}
         {activeTab === 'Site Inspections' && (
           <div>
             <h2 className="text-xl font-bold text-gray-800 mb-6">Tasks Pending Verification</h2>
             {tasksToCheck.length === 0 && <p className="text-gray-500">All tasks verified.</p>}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {tasksToCheck.map(task => (
                 <div key={task._id} className="glass-panel p-4 flex justify-between items-center border border-amber-200">
                   <div>
                     <h4 className="font-bold text-gray-900">{task.title}</h4>
                     <p className="text-sm text-gray-500">{task.description}</p>
                     <p className="text-xs text-gray-400 mt-1">Completed by: {task.assignedTo?.name || 'Worker'}</p>
                   </div>
                   <button 
                    onClick={() => handleVerifyTask(task._id)}
                    className="btn btn-primary bg-emerald-600 hover:bg-emerald-500 text-xs"
                   >
                     Verify Quality
                   </button>
                 </div>
               ))}
             </div>
           </div>
         )}
       </div>
    </div>
  );
};

export default EngineerDashboard;
