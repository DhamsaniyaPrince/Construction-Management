import { useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import invoiceService from '../../services/invoiceService';
import projectService from '../../services/projectService';
import workerService from '../../services/workerService';
import materialRequestService from '../../services/materialRequestService';
import { formatINR } from '../../utils/currency';

const TABS = ['Global Overview', 'Material Requests', 'Approvals', 'Financials'];

const SiteManagerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Global Overview');
  const [loading, setLoading] = useState(false);

  // Data
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [workers, setWorkers] = useState([]); // To track total workforce
  const [materialRequests, setMaterialRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Form states
  const [newMaterialRequest, setNewMaterialRequest] = useState({
    title: '',
    description: '',
    materialType: 'raw_materials',
    quantity: '',
    unit: 'pieces',
    urgency: 'medium',
    project: '',
    estimatedDelivery: '',
    notes: '',
    budget: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, invoicesRes, workersRes, materialRequestsRes] = await Promise.all([
        projectService.getProjects(),
        invoiceService.getInvoices(),
        workerService.getWorkers(),
        materialRequestService.getMaterialRequests()
      ]);
      setProjects(projectsRes.data || projectsRes);
      setInvoices(invoicesRes.data || invoicesRes);
      setWorkers(workersRes.data || workersRes);
      setMaterialRequests(materialRequestsRes.data || materialRequestsRes);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveInvoice = async (id) => {
    try {
      await invoiceService.updateInvoice(id, { status: 'Approved' }); // Need to ensure service supports this
      alert('Invoice Approved');
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to approve invoice');
    }
  };

  const handleCreateMaterialRequest = async (e) => {
    e.preventDefault();
    try {
      await materialRequestService.createMaterialRequest(newMaterialRequest);
      alert('Material Request Created Successfully!');
      setNewMaterialRequest({
        title: '',
        description: '',
        materialType: 'raw_materials',
        quantity: '',
        unit: 'pieces',
        urgency: 'medium',
        project: '',
        estimatedDelivery: '',
        notes: '',
        budget: ''
      });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to create material request');
    }
  };

  const handleUpdateRequestStatus = async (requestId, status) => {
    try {
      await materialRequestService.updateMaterialRequestStatus(requestId, { status });
      alert(`Request ${status} successfully!`);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to update request status');
    }
  };

  const handleRejectInvoice = async (id) => {
    try {
      await invoiceService.updateInvoice(id, { status: 'Rejected' });
      alert('Invoice Rejected');
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Rejection failed');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader /></div>;

  // Stats
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalSpent = invoices.filter(i => i.status === 'Approved').reduce((acc, i) => acc + (i.amount || 0), 0);
  const pendingInvoices = invoices.filter(i => i.status === 'Pending');

  return (
    <div className="min-h-screen p-6 pb-20">
      <header className="mb-8 flex justify-between items-center animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Site Command Center</h1>
          <p className="text-gray-500">Global Operations & Approvals.</p>
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
         {activeTab === 'Global Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6 border-b-4 border-blue-600">
                <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">Total Budget</h3>
                <p className="text-3xl font-bold text-gray-900">{formatINR(totalBudget)}</p>
                </div>
                <div className="glass-panel p-6 border-b-4 border-emerald-500">
                <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">Spent to Date</h3>
                <p className="text-3xl font-bold text-emerald-600">{formatINR(totalSpent)}</p>
                </div>
                <div className="glass-panel p-6 border-b-4 border-blue-400">
                <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">Active Projects</h3>
                <p className="text-3xl font-bold text-blue-600">{projects.length}</p>
                </div>
                <div className="glass-panel p-6 border-b-4 border-amber-500">
                <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">Workforce</h3>
                <p className="text-3xl font-bold text-amber-500">{workers.length}</p>
                </div>
            </div>

            <div className="glass-card">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Project Timeline Status</h3>
                <div className="space-y-4">
                    {projects.map(p => (
                        <div key={p._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                            <div>
                                <h4 className="font-bold text-gray-900">{p.name}</h4>
                                <p className="text-xs text-gray-500">Started: {new Date(p.startDate).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs ${
                                p.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                p.status === 'active' ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {p.status}
                            </span>
                        </div>
                    ))}
                    {projects.length === 0 && <p className="text-gray-500">No projects found.</p>}
                </div>
            </div>
          </div>
         )}

         {/* APPROVALS */}
         {activeTab === 'Approvals' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    Pending Invoices
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{pendingInvoices.length}</span>
                </h2>
                {pendingInvoices.length === 0 && <p className="text-gray-500 glass-panel p-8 text-center">No pending invoices.</p>}
                <div className="space-y-4">
                    {pendingInvoices.map(inv => (
                        <div key={inv._id} className="glass-panel p-4">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-lg text-gray-900">{inv.title}</h4>
                                    <p className="text-sm text-gray-500">Submitted by: {inv.contractor?.name}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(inv.createdAt).toDateString()}</p>
                                </div>
                                <span className="text-2xl font-bold text-gray-900">{formatINR(inv.amount)}</span>
                            </div>
                            
                            {inv.description && <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded">{inv.description}</p>}
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleApproveInvoice(inv._id)}
                                    className="flex-1 btn btn-primary bg-emerald-600 hover:bg-emerald-500 py-2 text-sm"
                                >
                                    Approve
                                </button>
                                <button 
                                    onClick={() => handleRejectInvoice(inv._id)}
                                    className="flex-1 btn bg-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 py-2 text-sm"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
             
             <div className="glass-panel p-6 h-fit">
                 <h2 className="text-xl font-bold text-gray-800 mb-4">Material Requests</h2>
                 <p className="text-gray-400 text-center py-10">No pending requests.</p>
             </div>
           </div>
         )}

         {/* MATERIAL REQUESTS TAB */}
         {activeTab === 'Material Requests' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Create New Request */}
             <div className="glass-card h-fit">
               <h2 className="text-xl font-bold text-gray-800 mb-4">Create Material Request</h2>
               <form onSubmit={handleCreateMaterialRequest} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Request Title *</label>
                   <input 
                     type="text" 
                     placeholder="e.g., Cement for Foundation"
                     value={newMaterialRequest.title}
                     onChange={e => setNewMaterialRequest({...newMaterialRequest, title: e.target.value})}
                     className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                     required
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Material Type *</label>
                     <select 
                       value={newMaterialRequest.materialType}
                       onChange={e => setNewMaterialRequest({...newMaterialRequest, materialType: e.target.value})}
                       className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                       required
                     >
                       <option value="raw_materials">Raw Materials</option>
                       <option value="equipment">Equipment</option>
                       <option value="tools">Tools</option>
                       <option value="safety">Safety Equipment</option>
                       <option value="electrical">Electrical</option>
                       <option value="plumbing">Plumbing</option>
                       <option value="finishing">Finishing Materials</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                     <select 
                       value={newMaterialRequest.urgency}
                       onChange={e => setNewMaterialRequest({...newMaterialRequest, urgency: e.target.value})}
                       className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                     >
                       <option value="low">Low</option>
                       <option value="medium">Medium</option>
                       <option value="high">High</option>
                       <option value="urgent">Urgent</option>
                     </select>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                     <input 
                       type="number" 
                       placeholder="e.g., 100"
                       value={newMaterialRequest.quantity}
                       onChange={e => setNewMaterialRequest({...newMaterialRequest, quantity: e.target.value})}
                       className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                     <select 
                       value={newMaterialRequest.unit}
                       onChange={e => setNewMaterialRequest({...newMaterialRequest, unit: e.target.value})}
                       className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                       required
                     >
                       <option value="kg">Kilograms (kg)</option>
                       <option value="tons">Tons</option>
                       <option value="pieces">Pieces</option>
                       <option value="boxes">Boxes</option>
                       <option value="liters">Liters</option>
                       <option value="meters">Meters</option>
                       <option value="sqft">Square Feet</option>
                     </select>
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                   <textarea 
                     placeholder="Detailed description of material requirements..."
                     rows="3"
                     value={newMaterialRequest.description}
                     onChange={e => setNewMaterialRequest({...newMaterialRequest, description: e.target.value})}
                     className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                   ></textarea>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                     <select 
                       value={newMaterialRequest.project}
                       onChange={e => setNewMaterialRequest({...newMaterialRequest, project: e.target.value})}
                       className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                     >
                       <option value="">Select Project</option>
                       {projects && projects.map(project => (
                         <option key={project._id} value={project._id}>{project.name}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery</label>
                     <input 
                       type="date" 
                       value={newMaterialRequest.estimatedDelivery}
                       onChange={e => setNewMaterialRequest({...newMaterialRequest, estimatedDelivery: e.target.value})}
                       className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Budget (₹)</label>
                   <input 
                     type="number" 
                     placeholder="e.g., 50000"
                     value={newMaterialRequest.budget}
                     onChange={e => setNewMaterialRequest({...newMaterialRequest, budget: e.target.value})}
                     className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                   />
                 </div>

                 <button type="submit" className="btn btn-primary w-full">Create Request</button>
               </form>
             </div>

             {/* Material Requests List */}
             <div className="lg:col-span-2 space-y-6">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-gray-800">All Material Requests</h2>
                 <div className="flex gap-2">
                   <select 
                     onChange={(e) => {
                       // Filter functionality can be added here
                     }}
                     className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                   >
                     <option value="">All Status</option>
                     <option value="pending">Pending</option>
                     <option value="approved">Approved</option>
                     <option value="ordered">Ordered</option>
                     <option value="delivered">Delivered</option>
                     <option value="completed">Completed</option>
                   </select>
                 </div>
               </div>

               {(!materialRequests || materialRequests.length === 0) ? (
                 <div className="glass-card p-12 text-center">
                   <div className="text-gray-400 text-lg mb-4">No material requests found</div>
                   <p className="text-gray-500">Create your first material request to get started</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {materialRequests && materialRequests.map(request => (
                     <div key={request._id} className="glass-card p-6 hover:shadow-lg transition-shadow">
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <h3 className="text-lg font-bold text-gray-800">{request.title}</h3>
                           <p className="text-sm text-gray-500">
                             Requested by: {request.requestedBy?.name} • {new Date(request.createdAt).toLocaleDateString()}
                           </p>
                         </div>
                         <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                           request.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
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
                           {request.assignedContractor ? `Assigned to: ${request.assignedContractor?.name}` : 'Not assigned'}
                         </div>
                         <div className="flex gap-2">
                           {request.status === 'pending' && (
                             <>
                               <button 
                                 onClick={() => handleUpdateRequestStatus(request._id, 'approved')}
                                 className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                               >
                                 Approve
                               </button>
                               <button 
                                 onClick={() => handleUpdateRequestStatus(request._id, 'rejected')}
                                 className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                               >
                                 Reject
                               </button>
                             </>
                           )}
                           {request.status === 'approved' && (
                             <button 
                               onClick={() => handleUpdateRequestStatus(request._id, 'ordered')}
                               className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                             >
                               Mark Ordered
                             </button>
                           )}
                           {request.status === 'ordered' && (
                             <button 
                               onClick={() => handleUpdateRequestStatus(request._id, 'delivered')}
                               className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                             >
                               Mark Delivered
                             </button>
                           )}
                           {request.status === 'delivered' && (
                             <button 
                               onClick={() => handleUpdateRequestStatus(request._id, 'completed')}
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
           </div>
         )}

         {/* FINANCIALS */}
         {activeTab === 'Financials' && (
             <div className="glass-card">
                 <h2 className="text-xl font-bold text-gray-800 mb-6">Financial Audit Log</h2>
                 <table className="w-full text-left text-sm">
                     <thead>
                         <tr className="text-gray-500 border-b border-gray-200">
                             <th className="pb-3">Reference</th>
                             <th className="pb-3">Type</th>
                             <th className="pb-3">Date</th>
                             <th className="pb-3">Status</th>
                             <th className="pb-3 text-right">Amount</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {invoices.map(inv => (
                             <tr key={inv._id} className="hover:bg-gray-50">
                                 <td className="py-3 font-medium text-gray-900">{inv.title}</td>
                                 <td className="py-3 text-gray-500">Invoice</td>
                                 <td className="py-3 text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                 <td className="py-3">
                                     <span className={`text-xs ${
                                         inv.status === 'Approved' ? 'text-emerald-600' :
                                         inv.status === 'Rejected' ? 'text-red-600' : 'text-amber-600'
                                     }`}>{inv.status}</span>
                                 </td>
                                 <td className="py-3 text-right font-mono text-gray-700">{formatINR(inv.amount)}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         )}
       </div>
    </div>
  );
};

export default SiteManagerDashboard;
