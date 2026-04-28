import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { projectService } from "../services/projectService";
import { userService } from "../services/userService";
import Loader from "../components/Loader";
import ErrorAlert from "../components/ErrorAlert";
import SuccessAlert from "../components/SuccessAlert";
import { useAuth } from "../context/AuthContext";

const Projects = () => {

  const { user } = useAuth();
  const location = useLocation();

  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProjects();

    if (user?.role === "admin" || user?.role === "engineer") {
      fetchEngineers();
    }

  }, [page, location.key]);



  // ===============================
  // FETCH PROJECTS
  // ===============================

  const fetchProjects = async () => {

    try {

      setLoading(true);
      
      console.log(" Current user:", user);
      console.log(" User role:", user?.role);
      console.log(" User ID:", user?._id);

      const response = await projectService.getProjects({
        page,
        limit: 10
      });

      console.log("Projects API response:", response);
      console.log("Projects array length:", Array.isArray(response) ? response.length : response.data?.length || 0);

      if (Array.isArray(response)) {

        setProjects(response);

      } else {

        setProjects(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);

      }

    } catch (err) {

      console.error("Error fetching projects:", err);
      setError(err.response?.data?.message || "Failed to load projects");

    } finally {

      setLoading(false);

    }

  };



  // ===============================
  // FETCH ENGINEERS
  // ===============================

  const fetchEngineers = async () => {

    try {

      const response = await userService.getAll({
        role: "engineer"
      });

      console.log("Engineers:", response);

      if (Array.isArray(response)) {

        setEngineers(response);

      } else {

        setEngineers(response.data || []);

      }

    } catch (err) {

      console.error("Failed to load engineers:", err);

    }

  };



  // ===============================
  // DELETE PROJECT
  // ===============================

  const handleDelete = async (id) => {

    if (!window.confirm("Delete this project?")) return;

    try {

      await projectService.deleteProject(id);

      setSuccess("Project deleted successfully");

      fetchProjects();

      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {

      setError(err.response?.data?.message || "Failed to delete project");

    }

  };



  if (loading && projects.length === 0) {
    return <Loader />;
  }



  return (

    <section>

      <div className="flex justify-between mb-6">

        <h1 className="text-3xl font-bold">
          Projects
        </h1>

        
      </div>



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



      {/* =============================== */}
      {/* PROJECT GRID */}
      {/* =============================== */}

      <div className="grid md:grid-cols-3 gap-4">

        {projects.map((project) => (

          <div
            key={project._id}
            className="bg-white p-5 rounded shadow"
          >

            <h3 className="text-xl font-semibold">
              {project.name}
            </h3>

            <p className="text-gray-600 mt-2">
              {project.description}
            </p>

            <div className="flex justify-between mt-4">

              <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                {project.status}
              </span>

              <div className="flex gap-3">

                {(user?.role === "admin" || user?.role === "engineer") && (
                  <button
                    className="text-green-600"
                    onClick={() => {
                      setSelectedProject(project);
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>
                )}

                {user?.role === "admin" && (
                  <button
                    className="text-red-600"
                    onClick={() => handleDelete(project._id)}
                  >
                    Delete
                  </button>
                )}

              </div>

            </div>

          </div>

        ))}

      </div>



      {projects.length === 0 && !loading && (

        <p className="text-center mt-8 text-gray-500">
          No projects found
        </p>

      )}



      {/* =============================== */}
      {/* PAGINATION */}
      {/* =============================== */}

      {totalPages > 1 && (

        <div className="flex justify-center gap-4 mt-6">

          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="border px-4 py-2 rounded"
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border px-4 py-2 rounded"
          >
            Next
          </button>

        </div>

      )}

    </section>

  );
};

export default Projects;