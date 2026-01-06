import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/reportService';
import { projectService } from '../services/projectService';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReports();
    fetchProjects();
  }, [page, filterProject, filterDate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filterProject) params.project = filterProject;
      if (filterDate) params.date = filterDate;
      const data = await reportService.getAll(params);
      setReports(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
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

  if (loading && reports.length === 0) return <Loader />;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Daily Reports</h1>
        {(user?.role === 'admin' || user?.role === 'engineer' || user?.role === 'worker') && (
          <button
            onClick={() => setShowModal(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Submit Report
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
        <input
          type="date"
          value={filterDate}
          onChange={(e) => {
            setFilterDate(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}

      <div className="space-y-6">
        {reports.map((report) => (
          <ReportCard key={report._id} report={report} />
        ))}
      </div>

      {reports.length === 0 && !loading && (
        <p className="mt-8 text-center text-gray-500">No reports found</p>
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
        <ReportModal
          projects={projects}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setSuccess('Report submitted successfully');
            fetchReports();
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}
    </section>
  );
};

const ReportCard = ({ report }) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const BACKEND_URL = API_BASE_URL.replace('/api', '');

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{report.project?.name || 'Unknown Project'}</h3>
          <p className="mt-1 text-sm text-gray-600">
            By {report.createdBy?.name || 'Unknown'} on {new Date(report.date).toLocaleDateString()}
          </p>
        </div>
        <span className="text-sm text-gray-500">{new Date(report.createdAt).toLocaleString()}</span>
      </div>

      {report.text && (
        <div className="mb-4">
          <p className="text-gray-700 whitespace-pre-wrap">{report.text}</p>
        </div>
      )}

      {report.progress && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700">Progress:</p>
          <p className="text-gray-600">{report.progress}</p>
        </div>
      )}

      {report.images && report.images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {report.images.map((img, idx) => {
            // If URL is already absolute, use it; otherwise prepend backend URL
            const imageUrl = img.url.startsWith('http') ? img.url : `${BACKEND_URL}${img.url}`;
            return (
              <img
                key={idx}
                src={imageUrl}
                alt={`Report image ${idx + 1}`}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const ReportModal = ({ projects, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    project: '',
    date: new Date().toISOString().split('T')[0],
    text: '',
    progress: '',
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('project', formData.project);
      submitData.append('date', formData.date);
      submitData.append('text', formData.text);
      if (formData.progress) submitData.append('progress', formData.progress);
      images.forEach((img) => submitData.append('images', img));

      await reportService.create(submitData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900">Submit Daily Report</h2>
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
            <label className="block text-sm font-medium text-gray-700">Report Text *</label>
            <textarea
              required
              rows={5}
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Describe today's work, progress, issues, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Progress Notes</label>
            <textarea
              rows={3}
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Additional progress details..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Images (max 5)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative">
                    <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-32 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-white">
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Reports;



