import api from './api';

// Get all workers (filtered byrole=worker)
const getWorkers = async () => {
  // We need an endpoint for this. 
  // currently /api/users might return everyone or requires admin. 
  // We'll trust the backend filters or we might need to add a specialized endpoint.
  // Let's assume /api/users?role=worker will be implemented or we filter client side for now if generic list returns.
  const response = await api.get('/users?role=worker'); 
  return response.data;
};

const addWorker = async (workerData) => {
  // Use the new contractor endpoint for adding workers
  const response = await api.post('/users/add-worker', workerData);
  return response.data;
};

const workerService = {
  getWorkers,
  addWorker
};

export default workerService;
