// Project Status Constants
// These must match the backend Project schema enum values

export const PROJECT_STATUS = [
  "planning",
  "active", 
  "on-hold",
  "completed",
  "cancelled"
];

export const PROJECT_STATUS_LABELS = {
  "planning": "Planning",
  "active": "Active",
  "on-hold": "On Hold",
  "completed": "Completed", 
  "cancelled": "Cancelled"
};

export const PROJECT_STATUS_COLORS = {
  "planning": "bg-blue-100 text-blue-800",
  "active": "bg-green-100 text-green-800",
  "on-hold": "bg-yellow-100 text-yellow-800",
  "completed": "bg-purple-100 text-purple-800",
  "cancelled": "bg-red-100 text-red-800"
};

// Helper function to validate status
export const isValidProjectStatus = (status) => {
  return PROJECT_STATUS.includes(status);
};

// Helper function to get status label
export const getProjectStatusLabel = (status) => {
  return PROJECT_STATUS_LABELS[status] || status;
};

// Helper function to get status color classes
export const getProjectStatusColor = (status) => {
  return PROJECT_STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
};
