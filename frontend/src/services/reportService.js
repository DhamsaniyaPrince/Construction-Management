import api from './api';

export const reportService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/reports', { params });
    return data;
  },
  create: async (formData) => {
    const { data } = await api.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};



