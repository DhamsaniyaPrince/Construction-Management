import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { materialService } from '../services/materialService';
import { projectService } from '../services/projectService';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';

const Materials = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMaterials();
    fetchProjects();
  }, [page, filterProject, filterStatus]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filterProject) params.project = filterProject;
      if (filterStatus) params.status = filterStatus;
      const data = await materialService.getAll(params);
      setMaterials(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load materials');
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

  const handleReview = async (id, action, notes) => {
    try {
      await materialService.review(id, action, notes);
      setSuccess(`Material request ${action}d successfully`);
      fetchMaterials();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to review material');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await materialService.updateStatus(id, status);
      setSuccess('Status updated successfully');
      fetchMaterials();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading && materials.length === 0) return <Loader />;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Material Requests</h1>
        {(user?.role === 'admin' || user?.role === 'engineer' || user?.role === 'contractor') && (
          <button
            onClick={() => setShowModal(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Request Material
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-4">
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
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="ordered">Ordered</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}

      <div className="space-y-4">
        {materials.map((material) => (
          <MaterialCard
            key={material._id}
            material={material}
            onApprove={() => handleReview(material._id, 'approve', '')}
            onReject={() => handleReview(material._id, 'reject', '')}
            onStatusUpdate={handleStatusUpdate}
            canReview={user?.role === 'admin' || user?.role === 'engineer'}
            canUpdateStatus={user?.role === 'admin' || user?.role === 'engineer'}
          />
        ))}
      </div>

      {materials.length === 0 && !loading && (
        <p className="mt-8 text-center text-gray-500">No material requests found</p>
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
        <MaterialRequestModal
          projects={projects}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setSuccess('Material request submitted successfully');
            fetchMaterials();
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}
    </section>
  );
};

const MaterialCard = ({ material, onApprove, onReject, onStatusUpdate, canReview, canUpdateStatus }) => {
  const [showStatusModal, setShowStatusModal] = useState(false);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{material.name}</h3>
          <p className="mt-1 text-sm text-gray-600">
            Quantity: {material.quantity} {material.unit}
          </p>
          <p className="mt-1 text-sm text-gray-600">Project: {material.project?.name || 'N/A'}</p>
          {material.notes && <p className="mt-2 text-sm text-gray-700">{material.notes}</p>}
          <p className="mt-2 text-xs text-gray-500">
            Requested by: {material.requestedBy?.name || 'Unknown'} on{' '}
            {new Date(material.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="ml-4 flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              material.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : material.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : material.status === 'delivered'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {material.status}
          </span>
          {canReview && material.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={onApprove}
                className="rounded-md bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={onReject}
                className="rounded-md bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          )}
          {canUpdateStatus && material.status === 'approved' && (
            <button
              onClick={() => setShowStatusModal(true)}
              className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
            >
              Update Status
            </button>
          )}
        </div>
      </div>

      {showStatusModal && (
        <StatusUpdateModal
          currentStatus={material.status}
          onClose={() => setShowStatusModal(false)}
          onUpdate={(status) => {
            onStatusUpdate(material._id, status);
            setShowStatusModal(false);
          }}
        />
      )}
    </div>
  );
};

const MaterialRequestModal = ({ projects, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    project: '',
    name: '',
    quantity: '',
    unit: 'pieces',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await materialService.request(formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900">Request Material</h2>
        {error && <ErrorAlert message={error} onClose={() => setError('')} />}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Material Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit *</label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="pieces">Pieces</option>
                <option value="kg">Kg</option>
                <option value="tons">Tons</option>
                <option value="bags">Bags</option>
                <option value="liters">Liters</option>
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
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatusUpdateModal = ({ currentStatus, onClose, onUpdate }) => {
  const [status, setStatus] = useState(currentStatus);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-xl font-bold">Update Status</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="approved">Approved</option>
              <option value="ordered">Ordered</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white">
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Materials;



