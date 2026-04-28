import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';
import { getProjectStatusLabel, getProjectStatusColor } from '../constants/projectStatus';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [engineers, setEngineers] = useState([]);
  const [siteManagers, setSiteManagers] = useState([]);

  useEffect(() => {
    fetchProject();
    fetchTeamMembers();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching project with ID:", id);
      const data = await projectService.getById(id);
      console.log("🔍 Project data received:", data);
      setProject(data);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err?.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const [engineersRes, siteManagersRes] = await Promise.all([
        userService.getAll({ role: 'engineer' }),
        userService.getAll({ role: 'site_manager' })
      ]);
      setEngineers(engineersRes.data || []);
      setSiteManagers(siteManagersRes.data || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };

  const handleAssignEngineers = async (engineerIds) => {
    try {
      await projectService.assignEngineers(id, { engineers: engineerIds });
      fetchProject();
      alert('Engineers assigned successfully!');
    } catch (err) {
      console.error('Error assigning engineers:', err);
      alert('Failed to assign engineers');
    }
  };

  const handleAssignSiteManagers = async (siteManagerIds) => {
    try {
      await projectService.assignSiteManagers(id, { siteManagers: siteManagerIds });
      fetchProject();
      alert('Site managers assigned successfully!');
    } catch (err) {
      console.error('Error assigning site managers:', err);
      alert('Failed to assign site managers');
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;
  if (!project) return <div className="text-center py-12 text-gray-500">Project not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-2">{project.description}</p>
            </div>
            <button
              onClick={() => navigate('/projects')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Projects
            </button>
          </div>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Location</label>
                  <p className="text-gray-900">{project.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProjectStatusColor(project.status)}`}>
                    {getProjectStatusLabel(project.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-gray-900">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">End Date</label>
                  <p className="text-gray-900">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Budget</label>
                  <p className="text-gray-900">{formatINR(project.budget) || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Contractor</label>
                  <p className="text-gray-900">{project.contractor?.name || 'Not assigned'}</p>
                </div>
              </div>
            </div>

            {/* Team Assignment */}
            {(user?.role === 'admin' || user?.role === 'contractor') && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Assignment</h2>
                
                {/* Engineers */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Engineers</h3>
                  <div className="mb-3">
                    <select
                      multiple
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      size="4"
                    >
                      {engineers.map(engineer => (
                        <option 
                          key={engineer._id} 
                          value={engineer._id}
                          selected={project.engineers?.some(e => e._id === engineer._id)}
                        >
                          {engineer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      const selected = Array.from(document.querySelector('select').selectedOptions)
                        .map(option => option.value);
                      handleAssignEngineers(selected);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Engineers
                  </button>
                </div>

                {/* Site Managers */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Site Managers</h3>
                  <div className="mb-3">
                    <select
                      multiple
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      size="4"
                    >
                      {siteManagers.map(manager => (
                        <option 
                          key={manager._id} 
                          value={manager._id}
                          selected={project.siteManagers?.some(s => s._id === manager._id)}
                        >
                          {manager.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      const selected = Array.from(document.querySelectorAll('select')[1].selectedOptions)
                        .map(option => option.value);
                      handleAssignSiteManagers(selected);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Site Managers
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Team */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Team</h2>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Engineers ({project.engineers?.length || 0})</h3>
                <div className="space-y-2">
                  {project.engineers?.map(engineer => (
                    <div key={engineer._id} className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {engineer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="ml-2 text-sm text-gray-700">{engineer.name}</span>
                    </div>
                  ))}
                  {(!project.engineers || project.engineers.length === 0) && (
                    <p className="text-sm text-gray-500">No engineers assigned</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Site Managers ({project.siteManagers?.length || 0})</h3>
                <div className="space-y-2">
                  {project.siteManagers?.map(manager => (
                    <div key={manager._id} className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-green-600">
                          {manager.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="ml-2 text-sm text-gray-700">{manager.name}</span>
                    </div>
                  ))}
                  {(!project.siteManagers || project.siteManagers.length === 0) && (
                    <p className="text-sm text-gray-500">No site managers assigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {(user?.role === 'admin' || user?.role === 'contractor') && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`/projects/${id}/edit`)}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Edit Project
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this project?')) {
                          projectService.deleteProject(id)
                            .then(() => navigate('/projects'))
                            .catch(err => alert('Failed to delete project'));
                        }
                      }}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete Project
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
