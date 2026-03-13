import api from './api';

export const equipmentService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/equipment', { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/equipment/${id}`);
    return data;
  },
  create: async (equipmentData) => {
    const { data } = await api.post('/equipment', equipmentData);
    return data;
  },
  assign: async (id, projectId) => {
    const { data } = await api.post(`/equipment/${id}/assign`, { projectId });
    return data;
  },
  updateStatus: async (id, status, condition, notes) => {
    const { data } = await api.put(`/equipment/${id}/status`, { status, condition, notes });
    return data;
  },
};



