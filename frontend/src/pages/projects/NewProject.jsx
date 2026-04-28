import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import Loader from '../../components/Loader';
import ErrorAlert from '../../components/ErrorAlert';
import SuccessAlert from '../../components/SuccessAlert';
import { PROJECT_STATUS, PROJECT_STATUS_LABELS } from '../../constants/projectStatus';

const NewProject = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'planning'
  });
  const [assignments, setAssignments] = useState({
    contractor: '',
    engineers: [],
    siteManagers: []
  });
  const [contractors, setContractors] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [siteManagers, setSiteManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchContractors();
      fetchEngineers();
      fetchSiteManagers();
    }
  }, [user]);

  const fetchContractors = async () => {
    try {
      const data = await userService.getUsersByRole('contractor');
      console.log("👷 Contractors response:", data);
      console.log("👷 Contractors array:", data);
      setContractors(data);
    } catch (err) {
      console.error('Error fetching contractors:', err);
    }
  };

  const fetchEngineers = async () => {
    try {
      const data = await userService.getUsersByRole('engineer');
      console.log("🔧 Engineers response:", data);
      console.log("🔧 Engineers array:", data);
      setEngineers(data);
    } catch (err) {
      console.error('Error fetching engineers:', err);
    }
  };

  const fetchSiteManagers = async () => {
    try {
      const data = await userService.getUsersByRole('site_manager');
      console.log("📋 Site managers response:", data);
      console.log("📋 Site managers array:", data);
      setSiteManagers(data);
    } catch (err) {
      console.error('Error fetching site managers:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAssignmentChange = (field, value) => {
    setAssignments(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    console.log("🔥 handleSubmit called!");
    e.preventDefault();
    console.log("🔥 Form prevented default");
    
    // Check if form data is valid
    if (!formData.name || !formData.location) {
      console.log("🔥 Form validation failed - missing required fields");
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields before creating payload
      if (!formData.name?.trim()) {
        setError('Project name is required');
        setLoading(false);
        return;
      }

      const payload = {
        name: formData.name?.trim(),
        description: formData.description?.trim() || '',
        location: formData.location?.trim() || '',
        contractor: assignments.contractor && assignments.contractor.trim() ? assignments.contractor.trim() : null,
        engineers: Array.isArray(assignments.engineers) ? assignments.engineers.filter(id => id && id.trim()) : [],
        siteManagers: Array.isArray(assignments.siteManagers) ? assignments.siteManagers.filter(id => id && id.trim()) : [],
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        budget: formData.budget && !isNaN(formData.budget) ? Number(formData.budget) : 0,
        status: formData.status || 'planning'
      };

      // Final validation
      if (!payload.name) {
        setError('Project name cannot be empty');
        setLoading(false);
        return;
      }

      // Validate status value
      if (!PROJECT_STATUS.includes(payload.status)) {
        setError(`Invalid status value: ${payload.status}. Must be one of: ${PROJECT_STATUS.join(', ')}`);
        setLoading(false);
        return;
      }

      console.log("🔥 Final normalized payload:", payload);
      console.log("🔥 Payload validation:", {
        name: !!payload.name,
        nameLength: payload.name?.length,
        contractor: payload.contractor,
        engineersCount: payload.engineers.length,
        siteManagersCount: payload.siteManagers.length,
        location: !!payload.location,
        budget: payload.budget,
        budgetValid: !isNaN(payload.budget) && payload.budget >= 0
      });

      console.log("🔥 About to call projectService.createProject");
      
     await projectService.createProject(payload);
      console.log("🔥 Project created successfully!");
      
      setSuccess('Project created successfully!');
      
      // Clear form after successful creation
      setFormData({
        name: '',
        description: '',
        location: '',
        startDate: '',
        endDate: '',
        budget: '',
        status: 'planning'
      });

      setTimeout(() => {
        navigate('/projects');
      }, 1500);
    } catch (err) {
      console.error('🔥 Error creating project:', err);
      console.error('🔥 Error response:', err?.response);
      console.error('🔥 Error data:', err?.response?.data);
      console.error('🔥 Error status:', err?.response?.status);
      
      let errorMessage = err?.response?.data?.message || 
                       err?.response?.data?.error || 
                       err?.message || 
                       'Failed to create project';
      
      // If validation errors exist, format them for display
      if (err?.response?.data?.errors && Array.isArray(err?.response?.data?.errors)) {
        const validationErrors = err.response.data.errors.map(error => 
          typeof error === 'string' ? error : error.message || error
        ).join(', ');
        errorMessage = `Validation failed: ${validationErrors}`;
      }
      
      // Handle specific status codes
      if (err?.response?.status === 409) {
        errorMessage = 'Project already exists. Please use a different name.';
      }
      
      console.error('🔥 Final error message:', errorMessage);
      setError(errorMessage);
      
      // Also show alert for immediate feedback
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <Link 
            to="/projects" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Projects
          </Link>
        </div>

        {error && <ErrorAlert message={error} />}
        {success && <SuccessAlert message={success} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project name"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project location"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project description"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget (₹)
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project budget"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                {PROJECT_STATUS.map(status => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contractor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Contractor
                  </label>
                  <select
                    value={assignments.contractor}
                    onChange={(e) => handleAssignmentChange('contractor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Contractor</option>
                    {contractors.map((contractor) => (
                      <option key={contractor._id} value={contractor._id}>
                        {contractor.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Engineer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Engineers
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {engineers.map((engineer) => (
                      <label key={engineer._id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignments.engineers.includes(engineer._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleAssignmentChange('engineers', [...assignments.engineers, engineer._id]);
                            } else {
                              handleAssignmentChange('engineers', assignments.engineers.filter(id => id !== engineer._id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{engineer.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Site Manager Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Site Managers
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {siteManagers.map((siteManager) => (
                      <label key={siteManager._id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignments.siteManagers.includes(siteManager._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleAssignmentChange('siteManagers', [...assignments.siteManagers, siteManager._id]);
                            } else {
                              handleAssignmentChange('siteManagers', assignments.siteManagers.filter(id => id !== siteManager._id));
                            }
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{siteManager.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Link
              to="/projects"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProject;
