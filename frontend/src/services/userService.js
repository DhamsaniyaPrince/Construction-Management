import api from './api';

export const userService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/users', { params });
    return data;
  },
};



