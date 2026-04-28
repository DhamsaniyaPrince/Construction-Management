import React, { useState, useEffect } from "react";
import {
  Calendar,
  Filter,
  Users,
  TrendingUp,
  PieChart,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import attendanceService from "../../services/attendanceService";
import workerService from "../../services/workerService";
import projectService from "../../services/projectService";
import { useAuth } from "../../context/AuthContext";
import { formatINR } from "../../utils/currency";

const AttendanceDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedContractor, setSelectedContractor] = useState("");
  const [viewMode, setViewMode] = useState("daily"); // daily, monthly

  // Data states
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [dailyStrength, setDailyStrength] = useState([]);
  const [laborDistribution, setLaborDistribution] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);

  // Form states for Site Manager
  const [attendanceForm, setAttendanceForm] = useState({});
  const [bulkAttendanceForm, setBulkAttendanceForm] = useState({
    date: new Date().toISOString().split("T")[0],
    project: "",
    attendanceRecords: [],
  });

  const isSiteManager = user.role === "site_manager" || user.role === "admin";
  const isContractor = user.role === "contractor";

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedProject, selectedContractor]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        date: selectedDate,
        ...(selectedProject && { project: selectedProject }),
        ...(selectedContractor && { contractor: selectedContractor }),
      };

      const [
        statsRes,
        strengthRes,
        laborRes,
        attendanceRes,
        workersRes,
        projectsRes,
      ] = await Promise.all([
        attendanceService.getAttendanceStats(params),
        attendanceService.getDailyStrength(params),
        attendanceService.getLaborDistribution(params),
        attendanceService.getProjectAttendance(
          selectedProject || "all",
          params,
        ),
        workerService.getWorkers(),
        projectService.getAll(),
      ]);

      setAttendanceStats(statsRes);
      setDailyStrength(strengthRes);
      setLaborDistribution(laborRes);
      setAttendanceRecords(attendanceRes.data || attendanceRes);
      setWorkers(workersRes.data || workersRes);
      setProjects(projectsRes.data || projectsRes);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (workerId, status) => {
    if (!isSiteManager) return;

    try {
      await attendanceService.mark({
        worker: workerId,
        project: selectedProject,
        date: selectedDate,
        status,
      });
      alert("Attendance marked successfully");
      fetchData();
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Failed to mark attendance");
    }
  };

  const handleBulkMarkAttendance = async () => {
    if (!isSiteManager) return;

    try {
      await attendanceService.bulkMarkAttendance(bulkAttendanceForm);
      alert("Bulk attendance marked successfully");
      fetchData();
      setBulkAttendanceForm({
        date: new Date().toISOString().split("T")[0],
        project: "",
        attendanceRecords: [],
      });
    } catch (error) {
      console.error("Error bulk marking attendance:", error);
      alert("Failed to bulk mark attendance");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-600";
      case "absent":
        return "bg-red-100 text-red-600";
      case "half_day":
        return "bg-yellow-100 text-yellow-600";
      case "leave":
        return "bg-blue-100 text-blue-600";
      case "holiday":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4" />;
      case "absent":
        return <XCircle className="w-4 h-4" />;
      case "half_day":
        return <Clock className="w-4 h-4" />;
      case "leave":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Attendance Management
        </h1>
        <div className="flex gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isSiteManager
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isSiteManager ? "Site Manager" : "Contractor (View Only)"}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              View Mode
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily View</option>
              <option value="monthly">Monthly View</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {attendanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {attendanceStats.present}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent Today</p>
                <p className="text-2xl font-bold text-red-600">
                  {attendanceStats.absent}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Half Day</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {attendanceStats.half_day}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {attendanceStats.attendanceRate}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Strength Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Daily Strength (Last 7 Days)
          </h3>
          <div className="h-64 flex items-end justify-around">
            {dailyStrength.map((day) => (
              <div key={day.date || day.day} className="flex flex-col items-center flex-1">
                <div
                  className="w-8 bg-blue-500 rounded-t"
                  style={{
                    height: `${(day.present / Math.max(...dailyStrength.map((d) => d.present))) * 100}%`,
                  }}
                ></div>
                <span className="text-xs mt-2">
                  {day._id.split("-").slice(1).join("/")}
                </span>
                <span className="text-xs font-bold">{day.present}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Labor Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Labor Distribution
          </h3>
          <div className="space-y-2">
            {laborDistribution.map((item, index) => (
              <div key={item.role} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor: [
                        "#10b981",
                        "#3b82f6",
                        "#f59e0b",
                        "#ef4444",
                      ][index],
                    }}
                  ></div>
                  <span className="text-sm font-medium">{item._id}</span>
                </div>
                <span className="text-sm font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Management Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {viewMode === "daily" ? "Daily Attendance" : "Monthly Attendance"}
          </h3>
        </div>

        {viewMode === "daily" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Worker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Working Hours
                  </th>
                  {isSiteManager && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {workers.map((worker) => {
                  const attendance = attendanceRecords.find(
                    (a) => a.worker._id === worker._id,
                  );
                  return (
                    <tr key={worker._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-medium">
                              {worker.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {worker.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {worker.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {worker.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attendance ? (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendance.status)}`}
                          >
                            {getStatusIcon(attendance.status)}
                            <span className="ml-1">
                              {attendance.status.charAt(0).toUpperCase() +
                                attendance.status.slice(1)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Not marked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attendance?.checkIn || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attendance?.checkOut || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attendance?.workingHours || "-"}
                      </td>
                      {isSiteManager && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                handleMarkAttendance(worker._id, "present")
                              }
                              className="px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 text-xs"
                            >
                              Present
                            </button>
                            <button
                              onClick={() =>
                                handleMarkAttendance(worker._id, "absent")
                              }
                              className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs"
                            >
                              Absent
                            </button>
                            <button
                              onClick={() =>
                                handleMarkAttendance(worker._id, "half_day")
                              }
                              className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 text-xs"
                            >
                              Half Day
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceDashboard;
