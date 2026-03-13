import api from './api';
import workerService from './workerService';

const getWorkerAnalytics = async () => {
  const response = await api.get('/users/analytics');
  return response.data;
};

const getWorkerById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

const getWorkers = async () => {
  try {
    const response = await api.get('/users?role=worker');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Failed to fetch workers:', error);
    return [];
  }
};

const workerAnalyticsService = {
  getWorkerAnalytics,
  getWorkerById,
  getWorkers
};

export default workerAnalyticsService;
