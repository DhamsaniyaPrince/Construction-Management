import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { attendanceService } from "../services/attendanceService";
import { projectService } from "../services/projectService";
import { userService } from "../services/userService";
import Loader from "../components/Loader";
import ErrorAlert from "../components/ErrorAlert";
import SuccessAlert from "../components/SuccessAlert";

const Attendance = () => {
  const { user } = useAuth();
  
  // State for attendance data
  const [attendance, setAttendance] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Form state for marking attendance
  const [formData, setFormData] = useState({
    worker: "",
    project: "",
    date: new Date().toISOString().split('T')[0],
    status: "present",
    checkIn: "",
    checkOut: "",
    notes: ""
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    project: "",
    date: "",  // Remove default date to show all records
    status: ""
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkAttendance, setBulkAttendance] = useState([]);

  // Fetch stats separately
  const fetchStats = async () => {
    if (user?.role === "admin" || user?.role === "contractor") {
      try {
        const statsData = await attendanceService.getAttendanceStats({
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          endDate: new Date(),
          project: filters.project || undefined
        });
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }
  };

  // Fetch data based on user role
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get projects
      const projectData = await projectService.getProjects();
      setProjects(Array.isArray(projectData) ? projectData : projectData.data || []);
      
      // Get workers (filter for workers only)
      const userData = await userService.getAll({ role: "worker" });
      setWorkers(Array.isArray(userData) ? userData : userData.data || []);
      
      // Get attendance using getAll method
      const params = {};
      if (filters.project) params.project = filters.project;
      if (filters.date) params.date = filters.date;
      if (filters.status) params.status = filters.status;
      
      const attendanceData = await attendanceService.getAll(params);
      console.log("🔍 Attendance API response:", attendanceData);
      const attendanceRecords = Array.isArray(attendanceData) ? attendanceData : attendanceData.data?.data || attendanceData.data || [];
      console.log("🔍 Processed attendance records:", attendanceRecords);
      setAttendance(attendanceRecords);
      
      // Get stats for admin/contractor
      await fetchStats();
      
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  // Mark attendance (single)
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    
    // Validation before marking attendance
    if (!formData.project) {
      setError("Please select a project first");
      return;
    }
    
    if (!formData.worker) {
      setError("Please select a worker first");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      await attendanceService.mark(formData);
      
      setSuccess("Attendance marked successfully");
      setShowModal(false);
      setFormData({
        worker: "",
        project: "",
        date: new Date().toISOString().split('T')[0],
        status: "present",
        checkIn: "",
        checkOut: "",
        notes: ""
      });
      
      // Refresh data and stats
      await fetchData();
      await fetchStats();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to mark attendance");
    } finally {
      setLoading(false);
    }
  };

  // Bulk mark attendance
  const handleBulkMarkAttendance = async () => {
    // Validation before marking bulk attendance
    if (!formData.project) {
      setError("Please select a project first");
      return;
    }
    
    if (!formData.date) {
      setError("Please select a date first");
      return;
    }
    
    if (bulkAttendance.length === 0) {
      setError("No workers to mark attendance for");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const attendanceRecords = bulkAttendance.map(record => ({
        worker: record.worker,
        status: record.status,
        checkIn: record.checkIn || "",
        checkOut: record.checkOut || "",
        notes: record.notes || ""
      }));
      
      await attendanceService.bulkMarkAttendance({
        date: formData.date,
        project: formData.project,
        attendanceRecords
      });
      
      setSuccess("Bulk attendance marked successfully");
      setBulkMode(false);
      setBulkAttendance([]);
      
      // Refresh data and stats
      await fetchData();
      await fetchStats();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to mark bulk attendance");
    } finally {
      setLoading(false);
    }
  };

  // Update attendance
const handleUpdateAttendance = async (id, updateData) => {
  try {
    setLoading(true);
    setError("");
    setSuccess("");

    // 1. Instant UI update first
    setAttendance((prev) =>
      prev.map((record) =>
        record._id === id
          ? {
              ...record,
              ...updateData
            }
          : record
      )
    );

    // 2. Save to database
    await attendanceService.updateAttendance(id, updateData);

    // 3. Refresh summary cards/statistics
    await fetchStats();

    // 4. Success message
    setSuccess("Attendance updated successfully");

    setTimeout(() => {
      setSuccess("");
    }, 2000);

  } catch (error) {
    console.error("Update attendance error:", error);

    setError(
      error.response?.data?.message ||
      "Failed to update attendance"
    );

    // If failed, reload original data
    await fetchData();

  } finally {
    setLoading(false);
  }
};

  // Initialize bulk attendance for selected project and date
  const initializeBulkAttendance = () => {
    if (!formData.project || !formData.date) return;
    
    const records = workers.map(worker => ({
      worker: worker._id,
      workerName: worker.name,
      status: "present",
      checkIn: "",
      checkOut: "",
      notes: ""
    }));
    
    setBulkAttendance(records);
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    if (bulkMode && formData.project && formData.date) {
      initializeBulkAttendance();
    }
  }, [bulkMode, formData.project, formData.date]);

  // Check if user can mark attendance
  const canMarkAttendance = user?.role === "site_manager" || user?.role === "admin";

  // Get status badge color
  const getStatusBadge = (status) => {
    const colors = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      half_day: "bg-yellow-100 text-yellow-800",
      leave: "bg-blue-100 text-blue-800",
      holiday: "bg-purple-100 text-purple-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading && attendance.length === 0) return <Loader />;

  return (
    <section className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === "site_manager" ? "Mark and manage daily attendance" : "View attendance records"}
          </p>
        </div>
        
        {canMarkAttendance && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Mark Attendance
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Bulk Mark
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards for Admin/Contractor */}
      {stats && (user?.role === "admin" || user?.role === "contractor") && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-white p-4 shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Present</h3>
            <p className="text-2xl font-bold text-green-600">{stats.present || 0}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Absent</h3>
            <p className="text-2xl font-bold text-red-600">{stats.absent || 0}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Half Day</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.half_day || 0}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Attendance Rate</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.attendanceRate || 0}%</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={filters.project}
          onChange={(e) => setFilters({ ...filters, project: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>
        
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2"
        />
        
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="half_day">Half Day</option>
          <option value="leave">Leave</option>
          <option value="holiday">Holiday</option>
        </select>
      </div>

      {/* Alerts */}
      {error && <ErrorAlert message={error} onClose={() => setError("")} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess("")} />}

      {/* Attendance Table */}
      <div className="rounded-lg bg-white shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In/Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Working Hours
                </th>
                {canMarkAttendance && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={canMarkAttendance ? "7" : "6"} className="px-6 py-8 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.worker?.name || record.workerName || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.worker?.role || "Worker"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.project?.name || record.projectName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkIn && record.checkOut ? (
                        <div>
                          <div>In: {record.checkIn}</div>
                          <div>Out: {record.checkOut}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not recorded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.workingHours ? `${record.workingHours}h` : "N/A"}
                      {record.overtime > 0 && (
                        <div className="text-xs text-blue-600">+{record.overtime}h OT</div>
                      )}
                    </td>
                    {canMarkAttendance && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={record.status}
                          onChange={(e) => handleUpdateAttendance(record._id, { status: e.target.value })}
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="half_day">Half Day</option>
                          <option value="leave">Leave</option>
                          <option value="holiday">Holiday</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
            
            <form onSubmit={handleMarkAttendance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Worker *</label>
                <select
                  required
                  value={formData.worker}
                  onChange={(e) => setFormData({ ...formData, worker: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Worker</option>
                  {workers.map((worker) => (
                    <option key={worker._id} value={worker._id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Project *</label>
                <select
                  required
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status *</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                  <option value="leave">Leave</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Check In</label>
                  <input
                    type="time"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Check Out</label>
                  <input
                    type="time"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Any additional notes..."
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Mark Attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Attendance Modal */}
      {bulkMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Bulk Mark Attendance</h2>
            
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project *</label>
                <select
                  required
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
            
            {bulkAttendance.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Workers ({bulkAttendance.length})</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBulkAttendance(bulkAttendance.map(record => ({ ...record, status: "present" })))}
                      className="text-xs rounded bg-green-100 px-2 py-1 text-green-800 hover:bg-green-200"
                    >
                      All Present
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkAttendance(bulkAttendance.map(record => ({ ...record, status: "absent" })))}
                      className="text-xs rounded bg-red-100 px-2 py-1 text-red-800 hover:bg-red-200"
                    >
                      All Absent
                    </button>
                  </div>
                </div>
                
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Worker</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Check In</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Check Out</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {bulkAttendance.map((record, index) => (
                        <tr key={`${record.worker}-${index}`}>
                          <td className="px-4 py-2 text-sm">{record.workerName}</td>
                          <td className="px-4 py-2">
                            <select
                              value={record.status}
                              onChange={(e) => {
                                const updated = [...bulkAttendance];
                                updated[index].status = e.target.value;
                                setBulkAttendance(updated);
                              }}
                              className="rounded border border-gray-300 px-2 py-1 text-xs"
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="half_day">Half Day</option>
                              <option value="leave">Leave</option>
                              <option value="holiday">Holiday</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="time"
                              value={record.checkIn}
                              onChange={(e) => {
                                const updated = [...bulkAttendance];
                                updated[index].checkIn = e.target.value;
                                setBulkAttendance(updated);
                              }}
                              className="rounded border border-gray-300 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="time"
                              value={record.checkOut}
                              onChange={(e) => {
                                const updated = [...bulkAttendance];
                                updated[index].checkOut = e.target.value;
                                setBulkAttendance(updated);
                              }}
                              className="rounded border border-gray-300 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={record.notes}
                              onChange={(e) => {
                                const updated = [...bulkAttendance];
                                updated[index].notes = e.target.value;
                                setBulkAttendance(updated);
                              }}
                              placeholder="Notes..."
                              className="rounded border border-gray-300 px-2 py-1 text-xs w-full"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBulkMode(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkMarkAttendance}
                disabled={loading || bulkAttendance.length === 0}
                className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Mark All Attendance"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Attendance;