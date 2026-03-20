import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [engineers, setEngineers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'admin' || user?.role === 'engineer') {
      fetchEngineers();
    }
  }, [page, user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll({ page, limit: 10 });
      setProjects(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchEngineers = async () => {
    try {
      const data = await userService.getAll({ role: 'engineer' });
      setEngineers(data.data || []);
    } catch (err) {
      console.error('Failed to load engineers:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectService.delete(id);
      setSuccess('Project deleted successfully');
      fetchProjects();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loading && projects.length === 0) return <Loader />;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        {(user?.role === 'admin' || user?.role === 'engineer') && (
          <button
            onClick={() => {
              setSelectedProject(null);
              setShowModal(true);
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + New Project
          </button>
        )}
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project._id}
            project={project}
            onView={() => {
              setSelectedProject(project);
              setShowDetails(true);
            }}
            onEdit={() => {
              setSelectedProject(project);
              setShowModal(true);
            }}
            onDelete={handleDelete}
            canEdit={user?.role === 'admin' || user?.role === 'engineer'}
            canDelete={user?.role === 'admin'}
          />
        ))}
      </div>

      {projects.length === 0 && !loading && (
        <p className="mt-8 text-center text-gray-500">No projects found</p>
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
        <ProjectModal
          project={selectedProject}
          engineers={engineers}
          onClose={() => {
            setShowModal(false);
            setSelectedProject(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedProject(null);
            setSuccess('Project saved successfully');
            fetchProjects();
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}

      {showDetails && selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          engineers={engineers}
          onClose={() => {
            setShowDetails(false);
            setSelectedProject(null);
          }}
          onUpdate={fetchProjects}
          canEdit={user?.role === 'admin' || user?.role === 'engineer'}
        />
      )}
    </section>
  );
};

const ProjectCard = ({ project, onView, onEdit, onDelete, canEdit, canDelete }) => (
  <div className="rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition">
    <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{project.description}</p>
    <div className="mt-4 flex items-center justify-between">
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          project.status === 'active'
            ? 'bg-green-100 text-green-800'
            : project.status === 'completed'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {project.status}
      </span>
      <div className="flex gap-2">
        <button onClick={onView} className="text-blue-600 hover:text-blue-800 text-sm">
          View
        </button>
        {canEdit && (
          <button onClick={onEdit} className="text-green-600 hover:text-green-800 text-sm">
            Edit
          </button>
        )}
        {canDelete && (
          <button onClick={() => onDelete(project._id)} className="text-red-600 hover:text-red-800 text-sm">
            Delete
          </button>
        )}
      </div>
    </div>
  </div>
);

const ProjectModal = ({ project, engineers, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    startDate: project?.startDate ? project.startDate.split('T')[0] : '',
    endDate: project?.endDate ? project.endDate.split('T')[0] : '',
    budget: project?.budget || '',
    status: project?.status || 'planned',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (project) {
        await projectService.update(project._id, formData);
      } else {
        await projectService.create(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900">{project ? 'Edit Project' : 'New Project'}</h2>
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
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Budget</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-white">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProjectDetailsModal = ({ project, engineers, onClose, onUpdate, canEdit }) => {
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAssignEngineers = async (engineerIds) => {
    try {
      setLoading(true);
      await projectService.assignEngineers(project._id, engineerIds);
      setSuccess('Engineers assigned successfully');
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign engineers');
    } finally {
      setLoading(false);
    }
  };

  const handleMilestoneAction = async (action, milestoneId, data) => {
    try {
      setLoading(true);
      if (action === 'add') {
        await projectService.addMilestone(project._id, data);
      } else if (action === 'update') {
        await projectService.updateMilestone(project._id, milestoneId, data);
      } else if (action === 'remove') {
        await projectService.removeMilestone(project._id, milestoneId);
      }
      setSuccess('Milestone updated successfully');
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update milestone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError('')} />}
        {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900">Description</h3>
            <p className="mt-1 text-gray-600">{project.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Status</h3>
              <p className="mt-1 text-gray-600 capitalize">{project.status}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Budget</h3>
              <p className="mt-1 text-gray-600">${project.budget || 'N/A'}</p>
            </div>
          </div>

          {canEdit && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Assign Engineers</h3>
              <EngineerAssignment
                project={project}
                engineers={engineers}
                onAssign={handleAssignEngineers}
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Milestones</h3>
              {canEdit && (
                <button
                  onClick={() => {
                    setSelectedMilestone(null);
                    setShowMilestoneModal(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Milestone
                </button>
              )}
            </div>
            <MilestonesList
              milestones={project.milestones || []}
              onEdit={(m) => {
                setSelectedMilestone(m);
                setShowMilestoneModal(true);
              }}
              onDelete={(id) => handleMilestoneAction('remove', id)}
              canEdit={canEdit}
            />
          </div>
        </div>

        {showMilestoneModal && (
          <MilestoneModal
            milestone={selectedMilestone}
            onClose={() => {
              setShowMilestoneModal(false);
              setSelectedMilestone(null);
            }}
            onSave={(data) => {
              if (selectedMilestone) {
                handleMilestoneAction('update', selectedMilestone._id, data);
              } else {
                handleMilestoneAction('add', null, data);
              }
              setShowMilestoneModal(false);
              setSelectedMilestone(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

const EngineerAssignment = ({ project, engineers, onAssign }) => {
  const [selected, setSelected] = useState(project.engineers?.map((e) => e._id) || []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(selected);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <select
        multiple
        value={selected}
        onChange={(e) => setSelected(Array.from(e.target.selectedOptions, (opt) => opt.value))}
        className="block w-full rounded-md border border-gray-300 px-3 py-2"
        size={4}
      >
        {engineers.map((eng) => (
          <option key={eng._id} value={eng._id}>
            {eng.name} ({eng.email})
          </option>
        ))}
      </select>
      <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">
        Assign Engineers
      </button>
    </form>
  );
};

const MilestonesList = ({ milestones, onEdit, onDelete, canEdit }) => {
  if (milestones.length === 0) return <p className="text-gray-500 text-sm">No milestones yet</p>;

  return (
    <div className="space-y-2">
      {milestones.map((m) => (
        <div key={m._id} className="flex items-center justify-between rounded border p-3">
          <div>
            <p className="font-medium">{m.title}</p>
            <p className="text-sm text-gray-600">{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'No date'}</p>
            <span
              className={`mt-1 inline-block rounded px-2 py-1 text-xs ${
                m.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : m.status === 'in-progress'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {m.status}
            </span>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <button onClick={() => onEdit(m)} className="text-blue-600 text-sm">Edit</button>
              <button onClick={() => onDelete(m._id)} className="text-red-600 text-sm">Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const MilestoneModal = ({ milestone, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: milestone?.title || '',
    dueDate: milestone?.dueDate ? milestone.dueDate.split('T')[0] : '',
    status: milestone?.status || 'pending',
    notes: milestone?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-xl font-bold">{milestone ? 'Edit Milestone' : 'New Milestone'}</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
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
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Projects;
