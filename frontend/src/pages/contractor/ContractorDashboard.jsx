import { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import TaskCard from "../../components/TaskCard";
import ImageUpload from "../../components/ImageUpload";
import StaffAssignmentCard from "../../components/StaffAssignmentCard";
import { useAuth } from "../../context/AuthContext";
import { invoiceService } from "../../services/invoiceService";
import { taskService } from "../../services/taskService";
import { projectService } from "../../services/projectService";
import { materialRequestService } from "../../services/materialRequestService";
import { userService } from "../../services/userService";
import { formatINR } from "../../utils/currency";

// Tabs
const TABS = [
  "Overview",
  "Assign Tasks",
  "Staff Management",
  "Invoices",
  "Material Requests",
  "My Projects",
];

const ContractorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");
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

  // Data States
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [siteManagers, setSiteManagers] = useState([]);

  // Form States
  const [newInvoice, setNewInvoice] = useState({
    title: "",
    amount: "",
    projectId: "",
    description: "",
    billImageUrl: "",
  });
  const [newTask, setNewTask] = useState({
    title: "",
    projectId: "",
    assignedTo: "",
    priority: "medium",
    description: "",
    siteLocation: "",
  });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        projects,
        tasksRes,
        materialRequestsRes,
        engineersRes,
        siteManagersRes,
      ] = await Promise.all([
        projectService.getProjects(), // Backend will filter by role
        taskService.getTasks(),
        materialRequestService.getContractorMaterialRequests(),
        userService.getAll({ role: "engineer" }),
        userService.getAll({ role: "site_manager" }),
      ]);

      console.log("Projects fetched:", projects);
      console.log("Projects type:", typeof projects);
      console.log("Is array:", Array.isArray(projects));
      console.log("Projects length:", projects?.length);

      setProjects(Array.isArray(projects) ? projects : []);
      setTasks(tasksRes.data || tasksRes);
      setMaterialRequests(materialRequestsRes.data || []);
      setEngineers(engineersRes.data || engineersRes);
      setSiteManagers(siteManagersRes.data || siteManagersRes);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const invoicesData = await invoiceService.getInvoices();
      
      console.log("Invoices fetched:", invoicesData);
      
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      fetchInvoices();
    }
  }, [user]);

  useEffect(() => {
    console.log("Projects state updated:", projects);
    console.log("Projects length:", projects?.length);
  }, [projects]);

  // Handlers
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    
    // Frontend validation
    if (!newInvoice.title?.trim()) {
      alert("Invoice title is required");
      return;
    }
    
    if (!newInvoice.amount || Number(newInvoice.amount) <= 0) {
      alert("Amount must be greater than 0");
      return;
    }
    
    if (!newInvoice.projectId?.trim()) {
      alert("Please select a project");
      return;
    }
    
    if (!newInvoice.billImageUrl?.trim()) {
      alert("Bill image URL is required");
      return;
    }
    
    // Validate URL format
    try {
      new URL(newInvoice.billImageUrl);
    } catch (error) {
      alert("Please enter a valid URL for the bill image");
      return;
    }
    
    console.log("🚀 Invoice Payload:", newInvoice);
    
    try {
      await invoiceService.createInvoice(newInvoice);
      setNewInvoice({ title: "", amount: "", projectId: "", description: "", billImageUrl: "" });
      await fetchInvoices(); // Wait for refresh
      alert("Invoice created successfully!");
    } catch (error) {
      console.error("Error creating invoice:", error.response?.data || error.message || error);
      if (error.response && error.response.status === 400) {
        alert(`Validation failed: ${error.response.data.message || 'Please check your input.'}`);
      } else if (error.response && error.response.status === 401) {
        alert("You are not authorized to create an invoice. Please log in again.");
      } else if (error.response && error.response.status === 403) {
        alert("You don't have permission to create invoices.");
      } else {
        alert("Failed to create invoice. Please try again later.");
      }
    }
  };

  const handleCreateTask = async (e) => {
  e.preventDefault();

  console.log("🚀 Task Payload:", newTask);

  try {

    const response = await taskService.createTask(newTask);

    console.log("✅ Task created:", response);

    setNewTask({
      title: "",
      projectId: "",
      assignedTo: "",
      priority: "medium",
      description: "",
      siteLocation: ""
    });

    fetchData();

    alert("Task created successfully!");

  } catch (error) {

    console.error("❌ Full Axios Error:", error);

    if (error.response) {

      console.error("🔴 Backend Error Message:", error.response.data);
      console.error("🔴 Status Code:", error.response.status);

      alert(error.response.data?.message || "Server error");

    } else if (error.request) {

      console.error("🟡 Request sent but no response:", error.request);
      alert("Server not responding");

    } else {

      console.error("⚠️ Axios setup error:", error.message);
      alert(error.message);

    }

  }
};

  const handleAssignEngineers = async (projectId, engineerIds) => {
    try {
      await projectService.assignEngineers(projectId, {
        engineers: engineerIds,
      });
      fetchData();
      alert("Engineers assigned successfully!");
    } catch (error) {
      console.error("Error assigning engineers:", error);
      alert("Failed to assign engineers");
    }
  };

  const handleContractorApproval = async (requestId, approved, comments = '') => {
    try {
      await materialRequestService.contractorApproval(requestId, { approved, comments });
      alert(`Material request ${approved ? 'approved' : 'rejected'} successfully!`);
      fetchData();
    } catch (error) {
      console.error('Contractor approval error:', error);
      const errorMessage = error?.response?.data?.message || 
                           error?.response?.data?.error || 
                           error?.message || 
                           'Failed to process approval';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await materialRequestService.updateRequestStatus(requestId, { status });
      alert(`Material request status updated to ${status.replace(/_/g, ' ')} successfully!`);
      fetchData();
    } catch (error) {
      console.error('Status update error:', error);
      const errorMessage = error?.response?.data?.message || 
                           error?.response?.data?.error || 
                           error?.message || 
                           'Failed to update status';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleAssignSiteManagers = async (projectId, siteManagerIds) => {
    try {
      await projectService.assignSiteManagers(projectId, {
        siteManagers: siteManagerIds,
      });
      fetchData();
      alert("Site managers assigned successfully!");
    } catch (error) {
      console.error("Error assigning site managers:", error);
      alert("Failed to assign site managers");
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Contractor Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Welcome back, {user?.name}</p>
          </div>
          <div className="flex gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* STAFF MANAGEMENT TAB */}
        {activeTab === "Staff Management" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Staff Management
              </h2>
              <div className="text-sm text-gray-500">
                {projects.length} projects • {engineers.length} engineers •{" "}
                {siteManagers.length} site managers
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-200">
                <div className="text-gray-400 text-lg mb-4">
                  No projects found
                </div>
                <p className="text-gray-500">
                  Create projects first to assign staff
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <StaffAssignmentCard
                    key={project._id}
                    project={project}
                    engineers={engineers}
                    siteManagers={siteManagers}
                    onAssignEngineers={handleAssignEngineers}
                    onAssignSiteManagers={handleAssignSiteManagers}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">
                Total Projects
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {projects.length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">
                Active Tasks
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {tasks.filter((t) => t.status !== "Completed").length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">
                Pending Invoices
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {invoices.filter((i) => i.status === "pending").length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">
                Material Requests
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {
                  materialRequests.filter(
                    (mr) => mr.status === "Technically Approved",
                  ).length
                }
              </p>
            </div>
          </div>
        )}

        {/* ASSIGN TASKS TAB */}
        {activeTab === "Assign Tasks" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Create New Task
                </h2>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Enter task description"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Location
                    </label>
                    <input
                      type="text"
                      value={newTask.siteLocation}
                      onChange={(e) =>
                        setNewTask({ ...newTask, siteLocation: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter site location"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project
                    </label>
                    <select
                      value={newTask.projectId}
                      onChange={(e) =>
                        setNewTask({ ...newTask, projectId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned To
                    </label>
                    <select
                      value={newTask.assignedTo}
                      onChange={(e) =>
                        setNewTask({ ...newTask, assignedTo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Worker</option>
                      {engineers.map((engineer) => (
                        <option key={engineer._id} value={engineer._id}>
                          {engineer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) =>
                        setNewTask({ ...newTask, priority: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Task
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Current Tasks
                </h2>
                <div className="space-y-4">
                  {tasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No tasks created yet.
                    </p>
                  ) : (
                    tasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onUpdateStatus={() => {}}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === "Invoices" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Create Invoice
                </h2>
                <form onSubmit={handleCreateInvoice} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Title
                    </label>
                    <input
                      type="text"
                      value={newInvoice.title}
                      onChange={(e) =>
                        setNewInvoice({ ...newInvoice, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={newInvoice.amount}
                      onChange={(e) =>
                        setNewInvoice({ ...newInvoice, amount: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project
                    </label>
                    <select
                      value={newInvoice.projectId}
                      onChange={(e) =>
                        setNewInvoice({
                          ...newInvoice,
                          projectId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newInvoice.description}
                      onChange={(e) =>
                        setNewInvoice({
                          ...newInvoice,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bill Image URL
                    </label>
                    <input
                      type="text"
                      value={newInvoice.billImageUrl}
                      onChange={(e) =>
                        setNewInvoice({
                          ...newInvoice,
                          billImageUrl: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter image URL (required)"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload bill image to cloud storage and paste URL here
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Invoice
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Recent Invoices
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            No invoices found
                          </td>
                        </tr>
                      ) : (
                        invoices.map((invoice) => (
                          <tr key={invoice._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {invoice.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatINR(invoice.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {invoice.project?.name || 'No project'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  invoice.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : invoice.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : invoice.status === "rejected"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(invoice.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button className="text-blue-600 hover:text-blue-900">
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MATERIAL REQUESTS TAB */}
        {activeTab === "Material Requests" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Material Requests
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materialRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No material requests found
                      </td>
                    </tr>
                  ) : (
                    materialRequests.map((request) => (
                      <tr key={request._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.materialName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.projectId?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {request.status === "ENGINEER_APPROVED" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleContractorApproval(request._id, true)}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleContractorApproval(request._id, false)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {request.status === "CONTRACTOR_APPROVED" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStatusUpdate(request._id, "PURCHASED")}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Mark Purchased
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(request._id, "DELIVERED")}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Mark Delivered
                              </button>
                            </div>
                          )}
                          {request.status !== "Technically Approved" && (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MY PROJECTS TAB */}
        {activeTab === "My Projects" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              My Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No projects found</p>
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-gray-900">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {project.description}
                    </p>
                    <div className="mt-4 flex justify-between items-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          project.status === "active"
                            ? "bg-green-100 text-green-800"
                            : project.status === "planning"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorDashboard;
