import { useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import invoiceService from '../../services/invoiceService';
import projectService from '../../services/projectService';
import workerService from '../../services/workerService';

const TABS = ['Global Overview', 'Approvals', 'Financials'];

const SiteManagerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Global Overview');
  const [loading, setLoading] = useState(false);

  // Data
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [workers, setWorkers] = useState([]); // To track total workforce

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, invoicesRes, workersRes] = await Promise.all([
        projectService.getProjects(),
        invoiceService.getInvoices(),
        workerService.getWorkers() 
      ]);
      setProjects(projectsRes.data || projectsRes);
      setInvoices(invoicesRes);
      setWorkers(workersRes.data || workersRes);
    } catch (error) {
      console.error(error);
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
      alert('Approval failed');
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
                <p className="text-3xl font-bold text-gray-900">${totalBudget.toLocaleString()}</p>
                </div>
                <div className="glass-panel p-6 border-b-4 border-emerald-500">
                <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">Spent to Date</h3>
                <p className="text-3xl font-bold text-emerald-600">${totalSpent.toLocaleString()}</p>
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
                                <span className="text-2xl font-bold text-gray-900">${inv.amount}</span>
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
             
             <div className="glass-panel p-6 h-fit opacity-75">
                 <h2 className="text-xl font-bold text-gray-800 mb-4">Material Requests</h2>
                 <p className="text-gray-400 text-center py-10">No pending requests.</p>
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
                                 <td className="py-3 text-right font-mono text-gray-700">${inv.amount}</td>
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
