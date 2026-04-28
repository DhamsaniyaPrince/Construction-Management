import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import Loader from '../../components/Loader';
import ErrorAlert from '../../components/ErrorAlert';
import SuccessAlert from '../../components/SuccessAlert';

const NewWorker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'worker',
    phone: '',
    specialization: 'General Labor',
    dailyWage: '',
    contractorId: ''
  });
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'contractor') {
      fetchContractors();
    }
  }, [user]);

  const fetchContractors = async () => {
    try {
      const data = await userService.getUsersByRole('contractor');
      setContractors(data);
    } catch (err) {
      console.error('Error fetching contractors:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {

    const payload = {
      name: formData.name,
      email: formData.email,
      password: "worker123",
      phone: formData.phone,
      dailyWage: formData.dailyWage
    };

    console.log("Worker Payload:", payload);

    await userService.addWorker(payload);

    alert("Worker created successfully");

  } catch (error) {
    console.error("Error creating worker:", error);
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
          <h1 className="text-3xl font-bold text-gray-900">Add New Worker</h1>
          <Link 
            to="/worker-list" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Workers
          </Link>
        </div>

        {error && <ErrorAlert message={error} />}
        {success && <SuccessAlert message={success} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Worker Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Worker Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter worker name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter worker email (optional)"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password (Optional)
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                minLength="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password (optional, min 6 characters)"
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization
              </label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="General Labor">General Labor</option>
                <option value="Carpenter">Carpenter</option>
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Mason">Mason</option>
                <option value="Painter">Painter</option>
                <option value="Welder">Welder</option>
                <option value="Heavy Equipment Operator">Heavy Equipment Operator</option>
              </select>
            </div>

            {/* Daily Wage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Wage (₹)
              </label>
              <input
                type="number"
                name="dailyWage"
                value={formData.dailyWage}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter daily wage"
              />
            </div>
          </div>

          {/* Contractor Assignment (Admin/Contractor Only) */}
          {(user?.role === 'admin' || user?.role === 'contractor') && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign to Contractor</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Contractor
                </label>
                <select
                  name="contractorId"
                  value={formData.contractorId}
                  onChange={handleInputChange}
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
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Link
              to="/worker-list"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Add Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewWorker;
