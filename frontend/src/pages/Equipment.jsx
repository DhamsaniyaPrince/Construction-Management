import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { equipmentService } from '../services/equipmentService';
import { projectService } from '../services/projectService';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';

const Equipment = () => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEquipment();
    fetchProjects();
  }, [page, filterStatus, filterProject]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filterStatus) params.status = filterStatus;
      if (filterProject) params.project = filterProject;
      const data = await equipmentService.getAll(params);
      setEquipment(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll({ limit: 100 });
      setProjects(data.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return;
    // Note: Delete endpoint not implemented in backend, but keeping UI consistent
    setError('Delete functionality not available');
  };

  if (loading && equipment.length === 0) return <Loader />;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Equipment</h1>
        {(user?.role === 'admin' || user?.role === 'engineer') && (
          <button
            onClick={() => {
              setSelectedEquipment(null);
              setShowModal(true);
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Add Equipment
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-4">
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="in-use">In Use</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>
        <select
          value={filterProject}
          onChange={(e) => {
            setFilterProject(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {equipment.map((item) => (
          <EquipmentCard
            key={item._id}
            equipment={item}
            projects={projects}
            onAssign={() => {
              setSelectedEquipment(item);
              setShowModal('assign');
            }}
            onUpdateStatus={() => {
              setSelectedEquipment(item);
              setShowModal('status');
            }}
            onView={() => {
              setSelectedEquipment(item);
              setShowModal('details');
            }}
            canEdit={user?.role === 'admin' || user?.role === 'engineer'}
          />
        ))}
      </div>

      {equipment.length === 0 && !loading && (
        <p className="mt-8 text-center text-gray-500">No equipment found</p>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border px-4 py-2 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md border px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <>
          {showModal === true && (
            <EquipmentModal
              onClose={() => {
                setShowModal(false);
                setSelectedEquipment(null);
              }}
              onSuccess={() => {
                setShowModal(false);
                setSelectedEquipment(null);
                setSuccess('Equipment added successfully');
                fetchEquipment();
                setTimeout(() => setSuccess(''), 3000);
              }}
            />
          )}
          {showModal === 'assign' && selectedEquipment && (
            <AssignEquipmentModal
              equipment={selectedEquipment}
              projects={projects}
              onClose={() => {
                setShowModal(false);
                setSelectedEquipment(null);
              }}
              onSuccess={() => {
                setShowModal(false);
                setSelectedEquipment(null);
                setSuccess('Equipment assigned successfully');
                fetchEquipment();
                setTimeout(() => setSuccess(''), 3000);
              }}
            />
          )}
          {showModal === 'status' && selectedEquipment && (
            <StatusUpdateModal
              equipment={selectedEquipment}
              onClose={() => {
                setShowModal(false);
                setSelectedEquipment(null);
              }}
              onSuccess={() => {
                setShowModal(false);
                setSelectedEquipment(null);
                setSuccess('Status updated successfully');
                fetchEquipment();
                setTimeout(() => setSuccess(''), 3000);
              }}
            />
          )}
          {showModal === 'details' && selectedEquipment && (
            <EquipmentDetailsModal
              equipment={selectedEquipment}
              onClose={() => {
                setShowModal(false);
                setSelectedEquipment(null);
              }}
            />
          )}
        </>
      )}
    </section>
  );
};

const EquipmentCard = ({ equipment, projects, onAssign, onUpdateStatus, onView, canEdit }) => (
  <div className="rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition">
    <h3 className="text-xl font-semibold text-gray-900">{equipment.name}</h3>
    <p className="mt-1 text-sm text-gray-600">Category: {equipment.category}</p>
    {equipment.serialNumber && (
      <p className="mt-1 text-sm text-gray-600">Serial: {equipment.serialNumber}</p>
    )}
    {equipment.assignedProject && (
      <p className="mt-1 text-sm text-gray-600">
        Assigned to: {projects.find((p) => p._id === equipment.assignedProject)?.name || 'Unknown'}
      </p>
    )}
    <div className="mt-4 flex items-center justify-between">
      <div className="flex gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            equipment.status === 'available'
              ? 'bg-green-100 text-green-800'
              : equipment.status === 'in-use'
              ? 'bg-blue-100 text-blue-800'
              : equipment.status === 'maintenance'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {equipment.status}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            equipment.condition === 'new'
              ? 'bg-green-100 text-green-800'
              : equipment.condition === 'good'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {equipment.condition}
        </span>
      </div>
      <div className="flex gap-2">
        <button onClick={onView} className="text-blue-600 hover:text-blue-800 text-sm">
          View
        </button>
        {canEdit && (
          <>
            <button onClick={onAssign} className="text-green-600 hover:text-green-800 text-sm">
              Assign
            </button>
            <button onClick={onUpdateStatus} className="text-purple-600 hover:text-purple-800 text-sm">
              Status
            </button>
          </>
        )}
      </div>
    </div>
  </div>
);

const EquipmentModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    serialNumber: '',
    condition: 'new',
    status: 'available',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await equipmentService.create(formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900">Add Equipment</h2>
        {error && <ErrorAlert message={error} onClose={() => setError('')} />}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Serial Number</label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="needs-repair">Needs Repair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="available">Available</option>
                <option value="in-use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
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
              {loading ? 'Adding...' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AssignEquipmentModal = ({ equipment, projects, onClose, onSuccess }) => {
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await equipmentService.assign(equipment._id, projectId);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900">Assign Equipment</h2>
        <p className="mt-1 text-sm text-gray-600">{equipment.name}</p>
        {error && <ErrorAlert message={error} onClose={() => setError('')} />}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project *</label>
            <select
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
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
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-white">
              {loading ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatusUpdateModal = ({ equipment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    status: equipment.status,
    condition: equipment.condition,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await equipmentService.updateStatus(equipment._id, formData.status, formData.condition, formData.notes);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900">Update Status</h2>
        {error && <ErrorAlert message={error} onClose={() => setError('')} />}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="available">Available</option>
              <option value="in-use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Condition</label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="needs-repair">Needs Repair</option>
              <option value="poor">Poor</option>
            </select>
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
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EquipmentDetailsModal = ({ equipment, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{equipment.name}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
      </div>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900">Category</h3>
          <p className="text-gray-600">{equipment.category}</p>
        </div>
        {equipment.serialNumber && (
          <div>
            <h3 className="font-semibold text-gray-900">Serial Number</h3>
            <p className="text-gray-600">{equipment.serialNumber}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">Status</h3>
            <p className="text-gray-600 capitalize">{equipment.status}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Condition</h3>
            <p className="text-gray-600 capitalize">{equipment.condition}</p>
          </div>
        </div>
        {equipment.history && equipment.history.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">History</h3>
            <div className="space-y-2">
              {equipment.history.map((entry, idx) => (
                <div key={idx} className="rounded border p-3">
                  <p className="text-sm font-medium">{entry.action}</p>
                  <p className="text-xs text-gray-600">{new Date(entry.changedAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default Equipment;



