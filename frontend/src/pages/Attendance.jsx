import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceService } from '../services/attendanceService';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';

const Attendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('project'); // 'project' or 'worker'

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'admin' || user?.role === 'engineer') {
      fetchWorkers();
    }
    if (selectedProject) {
      fetchAttendance();
    }
  }, [selectedProject, selectedDate, viewMode]);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll({ limit: 100 });
      setProjects(data.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const data = await userService.getAll({ role: 'worker', limit: 100 });
      setWorkers(data.data || []);
    } catch (err) {
      console.error('Failed to load workers:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = { date: selectedDate };
      let data;
      if (viewMode === 'project') {
        data = await attendanceService.getProjectAttendance(selectedProject, params);
      } else {
        const workerId = selectedProject; // In worker mode, selectedProject is workerId
        data = await attendanceService.getWorkerAttendance(workerId, params);
      }
      setAttendance(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (attendanceData) => {
    try {
      await attendanceService.mark(attendanceData);
      setSuccess('Attendance marked successfully');
      fetchAttendance();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        {(user?.role === 'admin' || user?.role === 'engineer' || user?.role === 'contractor') && (
          <button
            onClick={() => setShowModal(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Mark Attendance
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
          <select
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value);
              setSelectedProject('');
            }}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="project">By Project</option>
            <option value="worker">By Worker</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {viewMode === 'project' ? 'Project' : 'Worker'}
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Select {viewMode === 'project' ? 'Project' : 'Worker'}</option>
            {viewMode === 'project'
              ? projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))
              : workers.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}

      {loading ? (
        <Loader />
      ) : attendance.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">No attendance records found</p>
      ) : (
        <div className="space-y-4">
          {attendance.map((record) => (
            <AttendanceCard key={record._id} record={record} />
          ))}
        </div>
      )}

      {showModal && (
        <MarkAttendanceModal
          projects={projects}
          workers={workers}
          onClose={() => setShowModal(false)}
          onSuccess={handleMarkAttendance}
        />
      )}
    </section>
  );
};

const AttendanceCard = ({ record }) => (
  <div className="rounded-lg bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {record.worker?.name || 'Unknown Worker'}
        </h3>
        <p className="mt-1 text-sm text-gray-600">Project: {record.project?.name || 'N/A'}</p>
        <p className="mt-1 text-sm text-gray-600">
          Date: {new Date(record.date).toLocaleDateString()}
        </p>
        {record.checkIn && (
          <p className="mt-1 text-sm text-gray-600">
            Check-in: {new Date(record.checkIn).toLocaleTimeString()}
          </p>
        )}
        {record.checkOut && (
          <p className="mt-1 text-sm text-gray-600">
            Check-out: {new Date(record.checkOut).toLocaleTimeString()}
          </p>
        )}
        {record.notes && <p className="mt-2 text-sm text-gray-700">{record.notes}</p>}
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          record.status === 'present'
            ? 'bg-green-100 text-green-800'
            : record.status === 'absent'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {record.status}
      </span>
    </div>
  </div>
);

const MarkAttendanceModal = ({ projects, workers, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    worker: '',
    project: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkIn: '',
    checkOut: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = { ...formData };
      if (data.checkIn) data.checkIn = new Date(`${data.date}T${data.checkIn}`).toISOString();
      if (data.checkOut) data.checkOut = new Date(`${data.date}T${data.checkOut}`).toISOString();
      await onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
        {error && <ErrorAlert message={error} onClose={() => setError('')} />}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Worker *</label>
            <select
              required
              value={formData.worker}
              onChange={(e) => setFormData({ ...formData, worker: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select Worker</option>
              {workers.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
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
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
                <option value="leave">Leave</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Check-in Time</label>
              <input
                type="time"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Check-out Time</label>
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
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-white">
              {loading ? 'Saving...' : 'Mark Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Attendance;



