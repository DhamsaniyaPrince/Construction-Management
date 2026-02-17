import api from './api';

export const authService = {
  // GOOGLE OAUTH LOGIN/SIGNUP
  googleLogin: async (googleToken, role) => {
    const response = await api.post('/auth/google', { token: googleToken, role });
    return response.data;
  },

  // EMAIL/PASSWORD SIGNUP
  register: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // PUBLIC SIGNUP WITH ROLE
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // EMAIL/PASSWORD LOGIN
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // GET CURRENT USER
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // LOGOUT
  logout: () => {
    localStorage.removeItem('token');
  },
};