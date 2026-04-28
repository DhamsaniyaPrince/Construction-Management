import { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import ProjectCard from "../../components/ProjectCard";
import { useAuth } from "../../context/AuthContext";
import { invoiceService } from "../../services/invoiceService";
import { projectService } from "../../services/projectService";
import { workerService } from "../../services/workerService";
import { materialRequestService } from "../../services/materialRequestService";
import { userService } from "../../services/userService";
import { formatINR } from "../../utils/currency";

const TABS = [
  "Global Overview",
  "Projects",
  "Manage Workers",
  "Material Requests",
  "Approvals",
  "Financials",
];

const SiteManagerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Global Overview");
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
  const [invoices, setInvoices] = useState([]);
  const [workers, setWorkers] = useState([]); // To track total workforce
  const [engineers, setEngineers] = useState([]); // Available engineers for assignment
  const [materialRequests, setMaterialRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Form states
  const [newMaterialRequest, setNewMaterialRequest] = useState({
    projectId: "",
    materialName: "",
    quantity: "",
    unit: "pieces",
    description: "",
  });

  // Worker management states
  const [newWorker, setNewWorker] = useState({
    name: "",
    email: "",
    password: "worker123",
    phone: "",
    dailyWage: "",
  });
  const [salaryUpdate, setSalaryUpdate] = useState({
    workerId: "",
    dailyWage: "",
  });

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
      const [
        projectsRes,
        invoicesRes,
        workersRes,
        materialRequestsRes,
        engineersRes,
      ] = await Promise.all([
        projectService.getProjects(), // Backend will filter by role
        invoiceService.getInvoices(),
        workerService.getWorkers(),
        materialRequestService.getMyMaterialRequests(),
        userService.getAll({ role: "engineer" }),
      ]);
      console.log("Projects fetched:", projectsRes);
      console.log("Projects type:", typeof projectsRes);
      console.log("Is array:", Array.isArray(projectsRes));
      console.log("Projects length:", projectsRes?.length);
      
      setProjects(Array.isArray(projectsRes) ? projectsRes : []);
      setInvoices(invoicesRes.data || invoicesRes);
      setWorkers(workersRes.data || workersRes);
      setMaterialRequests(materialRequestsRes.materialRequests || []);
      setEngineers(engineersRes.data || engineersRes);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveInvoice = async (id) => {
    try {
      await invoiceService.updateInvoice(id, { status: "Approved" }); // Need to ensure service supports this
      alert("Invoice Approved!");
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to approve invoice");
    }
  };

  const handleAssignEngineers = async (projectId, selectedEngineerIds) => {
    try {
      await projectService.assignEngineers(projectId, selectedEngineerIds);
      alert("Engineers assigned successfully!");
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to assign engineers");
    }
  };

  const handleCreateMaterialRequest = async (e) => {
    e.preventDefault();
    try {
      await materialRequestService.createMaterialRequest(newMaterialRequest);
      alert("Material Request Created Successfully!");
      setNewMaterialRequest({
        projectId: "",
        materialName: "",
        quantity: "",
        unit: "pieces",
        description: "",
      });
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to create material request");
    }
  };

  const handleUpdateRequestStatus = async (requestId, status) => {
    try {
      await materialRequestService.updateMaterialRequestStatus(requestId, {
        status,
      });
      alert(`Request ${status} successfully!`);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to update request status");
    }
  };

  // Worker management functions
  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      await workerService.addWorker(newWorker);
      alert("Worker Added Successfully!");
      setNewWorker({
        name: "",
        email: "",
        password: "worker123",
        phone: "",
        dailyWage: "",
      });
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to add worker");
    }
  };

  const handleRemoveWorker = async (workerId) => {
    if (
      window.confirm(
        "Are you sure you want to remove this worker? This action cannot be undone.",
      )
    ) {
      try {
        await workerService.removeWorker(workerId);
        alert("Worker Removed Successfully!");
        fetchData();
      } catch (error) {
        console.error(error);
        alert("Failed to remove worker");
      }
    }
  };

  const handleUpdateSalary = async (e) => {
    e.preventDefault();
    if (!salaryUpdate.workerId || !salaryUpdate.dailyWage) {
      return alert("Please select a worker and enter a daily wage");
    }

    try {
      const response = await workerService.updateWorkerSalary(salaryUpdate);
      alert("Worker Salary Updated Successfully!");
      setSalaryUpdate({ workerId: "", dailyWage: "" });
      fetchData();
    } catch (error) {
      console.error("Salary update error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update worker salary";
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleRejectInvoice = async (id) => {
    try {
      await invoiceService.updateInvoice(id, { status: "Rejected" });
      alert("Invoice Rejected");
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Rejection failed");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader />
      </div>
    );

  // Stats
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalSpent = invoices
    .filter((i) => i.status === "Approved")
    .reduce((acc, i) => acc + (i.amount || 0), 0);
  const pendingInvoices = invoices.filter((i) => i.status === "Pending");

  return (
    <div className="min-h-screen p-6 pb-20">
      <header className="mb-8 flex justify-between items-center animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Site Command Center
          </h1>
          <p className="text-gray-500">Global Operations & Approvals.</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="animate-fade-in">
        {/* OVERVIEW */}
        {activeTab === "Global Overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-panel p-6 border-b-4 border-blue-600">
                <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">
                  Total Budget
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {formatINR(totalBudget)}
                </p>
              </div>
              <div className="glass-panel p-6 border-b-4 border-emerald-500">
                <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">
                  Spent to Date
                </h3>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatINR(totalSpent)}
                </p>
              </div>
              <div className="glass-panel p-6 border-b-4 border-blue-400">
                <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">
                  Active Projects
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {projects.length}
                </p>
              </div>
              <div className="glass-panel p-6 border-b-4 border-amber-500">
                <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">
                  Workforce
                </h3>
                <p className="text-3xl font-bold text-amber-500">
                  {workers.length}
                </p>
              </div>
            </div>

            <div className="glass-card">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Project Timeline Status
              </h3>
              <div className="space-y-4">
                {projects.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                  >
                    <div>
                      <h4 className="font-bold text-gray-900">{p.name}</h4>
                      <p className="text-xs text-gray-500">
                        Started: {new Date(p.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        p.status === "completed"
                          ? "bg-emerald-100 text-emerald-600"
                          : p.status === "active"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-gray-500">No projects found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PROJECTS */}
        {activeTab === "Projects" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Project Management
              </h2>
              <div className="text-sm text-gray-500">
                {projects.length} total projects
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="text-gray-400 text-lg mb-4">
                  No projects found
                </div>
                <p className="text-gray-500">
                  Create your first project to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    engineers={engineers}
                    onAssignEngineers={handleAssignEngineers}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MANAGE WORKERS */}
        {activeTab === "Manage Workers" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add Worker Form */}
            <div className="glass-card lg:col-span-1 h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Add New Worker
              </h2>
              <form onSubmit={handleAddWorker} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newWorker.name}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, name: e.target.value })
                  }
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address (Optional)"
                  value={newWorker.email}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, email: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newWorker.phone}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, phone: e.target.value })
                  }
                  required
                />
                <input
                  type="number"
                  placeholder="Daily Wage (₹)"
                  value={newWorker.dailyWage}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, dailyWage: e.target.value })
                  }
                />
                <button type="submit" className="btn btn-primary w-full">
                  Add Worker
                </button>
              </form>
            </div>

            {/* Workers List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Workforce Management
              </h2>

              {/* Salary Update Form */}
              <div className="glass-card p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Update Worker Salary
                </h3>
                <form onSubmit={handleUpdateSalary} className="flex gap-3">
                  <select
                    value={salaryUpdate.workerId}
                    onChange={(e) =>
                      setSalaryUpdate({
                        ...salaryUpdate,
                        workerId: e.target.value,
                      })
                    }
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Worker</option>
                    {workers &&
                      workers.map((worker) => (
                        <option key={worker._id} value={worker._id}>
                          {worker.name} - Current:{" "}
                          {formatINR(worker.dailyWage || 0)}
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    placeholder="New Daily Wage (₹)"
                    value={salaryUpdate.dailyWage}
                    onChange={(e) =>
                      setSalaryUpdate({
                        ...salaryUpdate,
                        dailyWage: e.target.value,
                      })
                    }
                    className="w-48 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <button type="submit" className="btn btn-primary">
                    Update Salary
                  </button>
                </form>
              </div>

              {(!workers || workers.length === 0) && (
                <p className="text-gray-500">No workers found.</p>
              )}
              {workers &&
                workers.map((worker) => (
                  <div
                    key={worker._id}
                    className="glass-panel p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600">
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {worker.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {worker.phone}
                          {worker.email ? ` • ${worker.email}` : ""}
                        </p>
                        <p className="text-sm text-gray-600">
                          Daily Wage: {formatINR(worker.dailyWage || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-semibold text-emerald-600">
                        Active
                      </span>
                      <span className="text-xs text-gray-400">
                        Role: Worker
                      </span>
                      <button
                        onClick={() => handleRemoveWorker(worker._id)}
                        className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* APPROVALS */}
        {activeTab === "Approvals" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                Pending Invoices
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                  {pendingInvoices.length}
                </span>
              </h2>
              {pendingInvoices.length === 0 && (
                <p className="text-gray-500 glass-panel p-8 text-center">
                  No pending invoices.
                </p>
              )}
              <div className="space-y-4">
                {pendingInvoices.map((inv) => (
                  <div key={inv._id} className="glass-panel p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">
                          {inv.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Submitted by: {inv.contractor?.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(inv.createdAt).toDateString()}
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatINR(inv.amount)}
                      </span>
                    </div>

                    {inv.description && (
                      <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded">
                        {inv.description}
                      </p>
                    )}

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
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Material Requests
              </h2>
              <p className="text-gray-400 text-center py-10">
                No pending requests.
              </p>
            </div>
          </div>
        )}

        {/* MATERIAL REQUESTS TAB */}
        {activeTab === "Material Requests" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create New Request */}
            <div className="glass-card h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Create Material Request
              </h2>
              <form
                onSubmit={handleCreateMaterialRequest}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project *
                  </label>
                  <select
                    value={newMaterialRequest.projectId}
                    onChange={(e) =>
                      setNewMaterialRequest({
                        ...newMaterialRequest,
                        projectId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Project</option>
                    {projects &&
                      projects.map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.name} ({project.projectId})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Cement, Steel, Bricks"
                    value={newMaterialRequest.materialName}
                    onChange={(e) =>
                      setNewMaterialRequest({
                        ...newMaterialRequest,
                        materialName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 100"
                      value={newMaterialRequest.quantity}
                      onChange={(e) =>
                        setNewMaterialRequest({
                          ...newMaterialRequest,
                          quantity: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit *
                    </label>
                    <select
                      value={newMaterialRequest.unit}
                      onChange={(e) =>
                        setNewMaterialRequest({
                          ...newMaterialRequest,
                          unit: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="tons">Tons</option>
                      <option value="pieces">Pieces</option>
                      <option value="bags">Bags</option>
                      <option value="liters">Liters</option>
                      <option value="meters">Meters</option>
                      <option value="feet">Feet</option>
                      <option value="cubic_meters">Cubic Meters</option>
                      <option value="square_meters">Square Meters</option>
                      <option value="boxes">Boxes</option>
                      <option value="bundles">Bundles</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    placeholder="Detailed description of material requirements..."
                    rows="3"
                    value={newMaterialRequest.description}
                    onChange={(e) =>
                      setNewMaterialRequest({
                        ...newMaterialRequest,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  Create Request
                </button>
              </form>
            </div>

            {/* Material Requests List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  All Material Requests
                </h2>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      // Filter functionality can be added here
                    }}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING_ENGINEER_APPROVAL">Pending Engineer Approval</option>
                    <option value="PENDING_CONTRACTOR_APPROVAL">Pending Contractor Approval</option>
                    <option value="ENGINEER_APPROVED">Engineer Approved</option>
                    <option value="ENGINEER_REJECTED">Engineer Rejected</option>
                    <option value="CONTRACTOR_APPROVED">Contractor Approved</option>
                    <option value="CONTRACTOR_REJECTED">Contractor Rejected</option>
                    <option value="PURCHASED">Purchased</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>
              </div>

              {!materialRequests || materialRequests.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <div className="text-gray-400 text-lg mb-4">
                    No material requests found
                  </div>
                  <p className="text-gray-500">
                    Create your first material request to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {materialRequests &&
                    materialRequests.map((request) => (
                      <div
                        key={request._id}
                        className="glass-card p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {request.materialName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Requested by: {request.requestedBy?.name} •{" "}
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Project: {request.projectId?.name || "N/A"}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        
                        {/* Status Flow Indicator */}
                        {request.status === "PENDING_ENGINEER_APPROVAL" && (
                          <div className="mt-2 text-xs text-gray-500">
                            ⏳ Waiting for engineer technical review
                          </div>
                        )}
                        {request.status === "ENGINEER_REJECTED" && (
                          <div className="mt-2 text-xs text-red-600">
                            ❌ Request rejected by engineer - please submit new request
                          </div>
                        )}
                        {request.status === "ENGINEER_APPROVED" && (
                          <div className="mt-2 text-xs text-blue-600">
                            ⏳ Engineer approved - waiting for contractor review
                          </div>
                        )}
                        {request.status === "CONTRACTOR_REJECTED" && (
                          <div className="mt-2 text-xs text-red-600">
                            ❌ Request rejected by contractor - please submit new request
                          </div>
                        )}
                        {request.status === "CONTRACTOR_APPROVED" && (
                          <div className="mt-2 text-xs text-green-600">
                            ✅ Contractor approved - processing order
                          </div>
                        )}
                        {request.status === "PURCHASED" && (
                          <div className="mt-2 text-xs text-purple-600">
                            📦 Materials purchased - awaiting delivery
                          </div>
                        )}
                        {request.status === "DELIVERED" && (
                          <div className="mt-2 text-xs text-green-600">
                            ✅ Materials delivered - request complete
                          </div>
                        )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-sm text-gray-600">
                              Material:
                            </span>
                            <span className="font-medium">
                              {request.materialName}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">
                              Quantity:
                            </span>
                            <span className="font-medium">
                              {request.quantity} {request.unit}
                            </span>
                          </div>
                        </div>

                        {request.description && (
                          <div className="mb-4">
                            <span className="text-sm text-gray-600">
                              Description:
                            </span>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded mt-1">
                              {request.description}
                            </p>
                          </div>
                        )}

                        {/* Engineer Approval Info */}
                        {(request.status === "ENGINEER_APPROVED" || request.status === "ENGINEER_REJECTED") && (
                          <div className="mb-4 p-3 bg-blue-50 rounded">
                            <div className="text-sm">
                              <span className="font-medium text-blue-700">
                                Engineer Review:{" "}
                              </span>
                              <span
                                className={
                                  request.status === "ENGINEER_APPROVED"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {request.status === "ENGINEER_APPROVED"
                                  ? "Approved"
                                  : "Rejected"}
                              </span>
                              {request.engineerRemarks && (
                                <span className="block text-gray-600 mt-1">
                                  "{request.engineerRemarks}"
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              By: {request.engineerApprovedBy?.name} •{" "}
                              {request.engineerApprovedAt &&
                                new Date(
                                  request.engineerApprovedAt,
                                ).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {/* Contractor Approval Info */}
                        {(request.status === "CONTRACTOR_APPROVED" || request.status === "CONTRACTOR_REJECTED") && (
                          <div className="mb-4 p-3 bg-green-50 rounded">
                            <div className="text-sm">
                              <span className="font-medium text-green-700">
                                Contractor Review:{" "}
                              </span>
                              <span
                                className={
                                  request.status === "CONTRACTOR_APPROVED"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {request.status === "CONTRACTOR_APPROVED"
                                  ? "Approved"
                                  : "Rejected"}
                              </span>
                              {request.contractorRemarks && (
                                <span className="block text-gray-600 mt-1">
                                  "{request.contractorRemarks}"
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              By: {request.contractorApprovedBy?.name} •{" "}
                              {request.contractorApprovedAt &&
                                new Date(
                                  request.contractorApprovedAt,
                                ).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-500">
                            Status:{" "}
                            <span className="font-medium">
                              {request.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          {(request.status === "PENDING_ENGINEER_APPROVAL") && (
                            <button
                              onClick={() =>
                                handleUpdateRequestStatus(
                                  request._id,
                                  "CANCELLED",
                                )
                              }
                              className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                            >
                              Cancel Request
                            </button>
                          )}
                          {(request.status === "ENGINEER_REJECTED" || request.status === "CONTRACTOR_REJECTED") && (
                            <span className="text-xs text-red-600 font-medium">
                              Request Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FINANCIALS */}
        {activeTab === "Financials" && (
          <div className="glass-card">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Financial Audit Log
            </h2>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-600 mb-1">
                  Successful Transactions
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {invoices.filter((inv) => inv.status === "Approved").length +
                    materialRequests.filter((req) => req.status === "DELIVERED")
                      .length}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-600 mb-1">
                  Total Revenue (Approved)
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatINR(
                    invoices
                      .filter((inv) => inv.status === "Approved")
                      .reduce((sum, inv) => sum + (inv.amount || 0), 0) +
                      materialRequests
                        .filter((req) => req.status === "DELIVERED")
                        .reduce(
                          (sum, req) =>
                            sum + (req.actualCost || req.budget || 0),
                          0,
                        ),
                  )}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">
                  Pending Transactions
                </div>
                <div className="text-2xl font-bold text-gray-700">
                  {invoices.filter((inv) => inv.status === "Pending").length +
                    materialRequests.filter(
                      (req) =>
                        req.status === "pending" ||
                        req.status === "approved" ||
                        req.status === "ordered" ||
                        req.status === "delivered",
                    ).length}
                </div>
              </div>
            </div>

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
                {/* Invoices */}
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">
                      {inv.title}
                    </td>
                    <td className="py-3 text-gray-500">Invoice</td>
                    <td className="py-3 text-gray-500">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          inv.status === "Approved"
                            ? "bg-emerald-100 text-emerald-600"
                            : inv.status === "Rejected"
                              ? "bg-red-100 text-red-600"
                              : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-gray-700">
                      {formatINR(inv.amount)}
                    </td>
                  </tr>
                ))}

                {/* Material Requests */}
                {materialRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">
                      {req.title}
                    </td>
                    <td className="py-3 text-gray-500">Material</td>
                    <td className="py-3 text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="py-3 text-right font-mono text-gray-700">
                      {formatINR(req.actualCost || req.budget || 0)}
                    </td>
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
