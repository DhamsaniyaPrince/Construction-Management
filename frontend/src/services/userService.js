import api from "./api";

export const userService = {

  // Get all users
  getAll: async (params = {}) => {
    const { data } = await api.get("/users", { params });
    console.log("🔍 Users API response:", data);
    return data;
  },

  // Get single user
  getById: async (id) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  // Create normal user
  createUser: async (payload) => {
    const { data } = await api.post("/users", payload);
    return data;
  },

  // ✅ ADD WORKER FUNCTION
  addWorker: async (payload) => {
    const { data } = await api.post("/users/add-worker", payload);
    return data;
  },

  // Update user
  update: async (id, payload) => {
    const { data } = await api.put(`/users/${id}`, payload);
    return data;
  },

  // Delete user
  delete: async (id) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },

  // Get users by role
  getUsersByRole: async (role) => {
    const { data } = await api.get("/users", {
      params: { role }
    });

    console.log("🔍 Users by role response:", data);

    return data.data ?? [];
  }
};