import api from './api';

// Get all material requests
const getMaterialRequests = async (params = {}) => {
  const { data } = await api.get('/materials', { params });
  return data;
};

// Get material request by ID
const getMaterialRequestById = async (id) => {
  const { data } = await api.get(`/materials/${id}`);
  return data;
};

// Create material request
const createMaterialRequest = async (requestData) => {
  const { data } = await api.post('/materials', requestData);
  return data;
};

// Update material request status
const updateMaterialRequestStatus = async (id, updateData) => {
  const { data } = await api.put(`/materials/${id}`, updateData);
  return data;
};

// Get material requests for contractors
const getMaterialRequestsForContractor = async () => {
  const { data } = await api.get('/materials/contractor/assigned');
  return data;
};

// Delete material request
const deleteMaterialRequest = async (id) => {
  const { data } = await api.delete(`/materials/${id}`);
  return data;
};

const materialRequestService = {
  getMaterialRequests,
  getMaterialRequestById,
  createMaterialRequest,
  updateMaterialRequestStatus,
  getMaterialRequestsForContractor,
  deleteMaterialRequest
};

export default materialRequestService;
