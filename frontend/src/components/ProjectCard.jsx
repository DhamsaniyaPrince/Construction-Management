import { useState } from "react";
import { formatINR } from "../utils/currency";

const ProjectCard = ({ project, engineers, onAssignEngineers }) => {
  const [selectedEngineers, setSelectedEngineers] = useState(
    project.engineers?.map((e) => e._id) || [],
  );

  const handleEngineerChange = (engineerId) => {
    setSelectedEngineers((prev) =>
      prev.includes(engineerId)
        ? prev.filter((id) => id !== engineerId)
        : [...prev, engineerId],
    );
  };

  const handleAssign = () => {
    console.log("🔍 ProjectCard - Assigning engineers to project:", project);
    console.log("🔍 ProjectCard - Project._id:", project._id);
    onAssignEngineers(project._id, selectedEngineers);
  };

  return (
    <div className="glass-card p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{project.name}</h3>
          <p className="text-sm text-gray-500">ID: {project.projectId}</p>
        </div>
        <span
          className={`px-3 py-1 text-xs rounded-full font-medium ${
            project.status === "active"
              ? "bg-green-100 text-green-600"
              : project.status === "planning"
                ? "bg-blue-100 text-blue-600"
                : project.status === "completed"
                  ? "bg-purple-100 text-purple-600"
                  : "bg-gray-100 text-gray-600"
          }`}
        >
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Start Date:</span>{" "}
          {new Date(project.startDate).toLocaleDateString()}
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">End Date:</span>{" "}
          {new Date(project.endDate).toLocaleDateString()}
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Budget:</span>{" "}
          {formatINR(project.budget || 0)}
        </div>
        {project.description && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Description:</span>
            <p className="mt-1 text-gray-500">{project.description}</p>
          </div>
        )}
      </div>

      {/* Engineer Assignment Section */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Assigned Engineers
        </h4>
        <div className="space-y-2 mb-4">
          {engineers.length === 0 ? (
            <p className="text-sm text-gray-500">No engineers available</p>
          ) : (
            engineers.map((engineer) => (
              <label
                key={engineer._id}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedEngineers.includes(engineer._id)}
                  onChange={() => handleEngineerChange(engineer._id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{engineer.name}</span>
                <span className="text-xs text-gray-500">
                  ({engineer.email})
                </span>
              </label>
            ))
          )}
        </div>
        <button
          onClick={handleAssign}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Update Engineer Assignment
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
