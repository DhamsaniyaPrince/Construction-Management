import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { materialRequestService } from "../services/materialRequestService";
import { projectService } from "../services/projectService";
import { getStatusDisplay, getStatusBadgeClass, canEngineerReview, canContractorReview } from "../utils/statusUtils";
import Loader from "../components/Loader";
import ErrorAlert from "../components/ErrorAlert";
import SuccessAlert from "../components/SuccessAlert";

const Materials = () => {
  const { user } = useAuth();

  const [materialRequests, setMaterialRequests] = useState([]);
  const [projects, setProjects] = useState([]);

  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMaterials();
    fetchProjects();
  }, [page, filterProject, filterStatus]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: 10,
      };

      if (filterProject) params.project = filterProject;
      if (filterStatus) params.status = filterStatus;

      let response;
      
      // Use role-specific API calls
      if (user?.role === 'engineer') {
        console.log("🔍 Using engineer-specific API");
        response = await materialRequestService.getEngineerMaterialRequests(params);
      } else {
        console.log("🔍 Using general API for role:", user?.role);
        response = await materialRequestService.getAllMaterialRequests(params);
      }

      const requests = Array.isArray(response)
        ? response
        : response.data || [];

      setMaterialRequests(requests);
      setTotalPages(response.pagination?.totalPages || 1);
      
      console.log("🔍 Material requests loaded:", {
        role: user?.role,
        count: requests.length,
        totalPages: response.pagination?.totalPages || 1
      });
    } catch (err) {
      console.error("🔍 Error loading material requests:", err.response?.data);
      setError(
        err.response?.data?.message || "Failed to load material requests"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      let projectList;
      
      // Use assigned projects API for Site Managers, regular API for others
      if (user?.role === 'site_manager') {
        projectList = await projectService.getAssignedProjects({ limit: 100 });
      } else {
        projectList = await projectService.getProjects({ limit: 100 });
      }

      const projects = Array.isArray(projectList)
        ? projectList
        : projectList.data || [];

      setProjects(projects);
    } catch (err) {
      console.error("Failed to load projects:", err);
      // If Site Manager gets 403, it means no projects assigned
      if (err.response?.status === 403 && user?.role === 'site_manager') {
        setProjects([]);
      }
    }
  };

  const handleReview = async (id, action) => {
    try {
      const status = action === "approve" ? "approved" : "rejected";

      await materialRequestService.updateMaterialRequestStatus(id, {
        status,
      });

      setSuccess(`Material request ${action}d successfully`);
      fetchMaterials();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to review request"
      );
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await materialRequestService.updateMaterialRequestStatus(id, {
        status,
      });

      setSuccess("Status updated successfully");
      fetchMaterials();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update status"
      );
    }
  };

  if (loading && materialRequests.length === 0) {
    return <Loader />;
  }

  return (
    <section>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Material Requests
        </h1>

        {(user?.role === "admin" ||
          user?.role === "engineer" ||
          user?.role === "contractor" ||
          user?.role === "site_manager") && (
          <button
            onClick={() => setShowModal(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Request Material
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <select
          value={filterProject}
          onChange={(e) => {
            setFilterProject(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">All Projects</option>

          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
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

      {/* Alerts */}
      {error && (
        <ErrorAlert
          message={error}
          onClose={() => setError("")}
        />
      )}

      {success && (
        <SuccessAlert
          message={success}
          onClose={() => setSuccess("")}
        />
      )}

      {/* Cards */}
      <div className="space-y-4">
        {materialRequests.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">
              No material requests found
            </p>
          </div>
        ) : (
          materialRequests.map((material) => (
            <MaterialCard
              key={material._id}
              material={material}
              onApprove={() =>
                handleReview(material._id, "approve")
              }
              onReject={() =>
                handleReview(material._id, "reject")
              }
              onStatusUpdate={handleStatusUpdate}
              canReview={
                user?.role === "admin" ||
                user?.role === "engineer"
              }
              canUpdateStatus={
                user?.role === "admin" ||
                user?.role === "engineer"
              }
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() =>
              setPage((prev) => Math.max(1, prev - 1))
            }
            disabled={page === 1}
            className="rounded-md border px-4 py-2 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() =>
              setPage((prev) =>
                Math.min(totalPages, prev + 1)
              )
            }
            disabled={page === totalPages}
            className="rounded-md border px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <MaterialRequestModal
          projects={projects}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setSuccess(
              "Material request submitted successfully"
            );
            fetchMaterials();

            setTimeout(() => setSuccess(""), 3000);
          }}
        />
      )}
    </section>
  );
};

/* ========================================================= */

const MaterialCard = ({
  material,
  onApprove,
  onReject,
  onStatusUpdate,
  canReview,
  canUpdateStatus,
}) => {
  const [showStatusModal, setShowStatusModal] =
    useState(false);

  const badgeClass = getStatusBadgeClass(material.status);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {material.materialName || material.name}
          </h3>

          <p className="mt-1 text-sm text-gray-600">
            Quantity: {material.quantity} {material.unit}
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Project: {material.projectId?.name || "N/A"}
          </p>

          {material.notes && (
            <p className="mt-2 text-sm text-gray-700">
              {material.notes}
            </p>
          )}

          <p className="mt-2 text-xs text-gray-500">
            Requested by{" "}
            {material.requestedBy?.name || "Unknown"} on{" "}
            {new Date(
              material.createdAt
            ).toLocaleDateString()}
          </p>
        </div>

        <div className="ml-4 flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}
          >
            {getStatusDisplay(material.status)}
          </span>
          
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs text-gray-400 mt-1">
              ID: {material._id?.slice(-6)}
            </span>
          )}

          {canReview && canEngineerReview(material.status) && (
            <div className="flex gap-2">
              <button
                onClick={onApprove}
                className="rounded-md bg-green-600 px-3 py-1 text-xs text-white"
              >
                Approve
              </button>

              <button
                onClick={onReject}
                className="rounded-md bg-red-600 px-3 py-1 text-xs text-white"
              >
                Reject
              </button>
            </div>
          )}

          {canUpdateStatus && canContractorReview(material.status) && (
            <button
              onClick={() =>
                setShowStatusModal(true)
              }
              className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white"
            >
              Update Status
            </button>
          )}
        </div>
      </div>

      {showStatusModal && (
        <StatusUpdateModal
          currentStatus={material.status}
          onClose={() =>
            setShowStatusModal(false)
          }
          onUpdate={(status) => {
            onStatusUpdate(material._id, status);
            setShowStatusModal(false);
          }}
        />
      )}
    </div>
  );
};

/* ========================================================= */

const MaterialRequestModal = ({
  projects,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    project: "",
    name: "",
    quantity: "",
    unit: "pieces",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if Site Manager has no assigned projects
  const isSiteManagerWithNoProjects = user?.role === 'site_manager' && projects.length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Map frontend form data to backend expected format
      const payload = {
        projectId: formData.project,
        materialName: formData.name,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        description: formData.notes || "", // Map notes to description
      };

      // DEBUG: Log payload before sending
      console.log("🔍 DEBUG - Original form data:", formData);
      console.log("🔍 DEBUG - Mapped payload:", JSON.stringify(payload, null, 2));
      console.log("🔍 DEBUG - Payload keys:", Object.keys(payload));

      await materialRequestService.createMaterialRequest(payload);

      onSuccess();
    } catch (err) {
      console.error("🔍 DEBUG - Error response:", err.response?.data);
      setError(
        err.response?.data?.message ||
          "Failed to submit request"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold">
          Request Material
        </h2>

        {error && (
          <ErrorAlert
            message={error}
            onClose={() => setError("")}
          />
        )}

        {isSiteManagerWithNoProjects ? (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              You have no projects assigned to you. Please contact your administrator to get projects assigned before requesting materials.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-4 space-y-4"
          >
          <select
            required
            value={formData.project}
            onChange={(e) =>
              setFormData({
                ...formData,
                project: e.target.value,
              })
            }
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="">Select Project</option>

            {projects.map((project) => (
              <option
                key={project._id}
                value={project._id}
              >
                {project.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            required
            placeholder="Material Name"
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value,
              })
            }
            className="w-full rounded-md border px-3 py-2"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              min="1"
              required
              placeholder="Quantity"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: e.target.value,
                })
              }
              className="rounded-md border px-3 py-2"
            />

            <select
              value={formData.unit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  unit: e.target.value,
                })
              }
              className="rounded-md border px-3 py-2"
            >
              <option value="pieces">Pieces</option>
              <option value="kg">Kg</option>
              <option value="tons">Tons</option>
              <option value="bags">Bags</option>
              <option value="liters">Liters</option>
            </select>
          </div>

          <textarea
            rows="3"
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({
                ...formData,
                notes: e.target.value,
              })
            }
            className="w-full rounded-md border px-3 py-2"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || isSiteManagerWithNoProjects}
              className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading
                ? "Submitting..."
                : "Submit Request"}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

/* ========================================================= */

const StatusUpdateModal = ({
  currentStatus,
  onClose,
  onUpdate,
}) => {
  const [status, setStatus] =
    useState(currentStatus);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-xl font-bold">
          Update Status
        </h3>

        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4"
        >
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="approved">
              Approved
            </option>
            <option value="ordered">
              Ordered
            </option>
            <option value="delivered">
              Delivered
            </option>
          </select>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-white"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Materials;