import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { projectService } from "../../services/projectService";
import { userService } from "../../services/userService";
import { invoiceService } from "../../services/invoiceService";

const AdminDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalProjects: 0,
    totalContractors: 0,
    totalEngineers: 0,
    totalSiteManagers: 0,
    totalWorkers: 0,
    recentProjects: [],
  });

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const handleInvoiceAction = async (id, status) => {
    try {
      await invoiceService.approveInvoice(id, status);
      fetchInvoices(); // Refresh the list
      alert(`Invoice ${status} successfully!`);
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert("Failed to update invoice. Please try again.");
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const projects = await projectService.getProjects();
        const usersResponse = await userService.getAll();

        const users = usersResponse?.data || [];

        const contractors = users.filter((u) => u.role === "contractor");
        const engineers = users.filter((u) => u.role === "engineer");
        const siteManagers = users.filter((u) => u.role === "site_manager");
        const workers = users.filter((u) => u.role === "worker");

        const recentProjects = projects.slice(0, 5).map((project) => ({
          ...project,
          contractor: project.contractor?.name || "Not assigned",
        }));
        
        console.log("🔍 AdminDashboard - recentProjects mapped:", recentProjects);

        setStats({
          totalProjects: projects.length,
          totalContractors: contractors.length,
          totalEngineers: engineers.length,
          totalSiteManagers: siteManagers.length,
          totalWorkers: workers.length,
          recentProjects,
        });
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchInvoices();
  }, []);

  const StatCard = ({ title, value, icon, color, link }) => (
    <Link
      to={link}
      className="block transform transition-all duration-200 hover:scale-105"
    >
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`text-3xl ${color}`}>{icon}</div>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.name}! Here's your system overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon="🏗️"
          color="text-blue-600"
          link="/projects"
        />

        <StatCard
          title="Total Contractors"
          value={stats.totalContractors}
          icon="👷‍♂️"
          color="text-green-600"
          link="/worker-list"
        />

        <StatCard
          title="Total Engineers"
          value={stats.totalEngineers}
          icon="🔧"
          color="text-purple-600"
          link="/worker-list"
        />

        <StatCard
          title="Total Site Managers"
          value={stats.totalSiteManagers}
          icon="📋"
          color="text-orange-600"
          link="/worker-list"
        />

        <StatCard
          title="Total Workers"
          value={stats.totalWorkers}
          icon="👥"
          color="text-indigo-600"
          link="/worker-analytics"
        />

        <StatCard
          title="System Health"
          value="✅"
          icon="🖥️"
          color="text-emerald-600"
          link="/reports"
        />
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>

          <Link
            to="/projects"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Name
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contractor
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentProjects.map((project) => (
                <tr key={project._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {project.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : project.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : project.status === "Planning"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.contractor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/projects/${project._id}`}
                      onClick={(e) => {
                        console.log("🔍 AdminDashboard - Clicking View, project._id:", project._id);
                        console.log("🔍 AdminDashboard - Navigating to:", `/projects/${project._id}`);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </Link>
                    <Link
                      to={`/projects/${project._id}/edit`}
                      onClick={(e) => {
                        console.log("🔍 AdminDashboard - Project clicked:", project);
                        console.log("🔍 AdminDashboard - Project._id:", project._id);
                        console.log("🔍 AdminDashboard - Navigating to:", `/projects/${project._id}/edit`);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Management */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Management</h2>
        
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No invoices found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contractor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{invoice.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.project?.name || 'No project'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.contractor?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : invoice.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {invoice.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleInvoiceAction(invoice._id, 'approved')}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleInvoiceAction(invoice._id, 'rejected')}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">
                          {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Unknown'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/projects/new"
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ➕ New Project
          </Link>

          <Link
            to="/worker-list/new"
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            👤 Add Worker
          </Link>

          <Link
            to="/reports"
            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            📊 Generate Report
          </Link>

          <Link
            to="/attendance"
            className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            📅 Mark Attendance
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
