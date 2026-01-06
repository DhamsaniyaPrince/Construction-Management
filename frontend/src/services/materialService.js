import api from './api';

export const materialService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/materials', { params });
    return data;
  },
  request: async (materialData) => {
    const { data } = await api.post('/materials', materialData);
    return data;
  },
  review: async (id, action, notes) => {
    const { data } = await api.post(`/materials/${id}/review`, { action, notes });
    return data;
  },
  updateStatus: async (id, status) => {
    const { data } = await api.put(`/materials/${id}/status`, { status });
    return data;
  },
};



