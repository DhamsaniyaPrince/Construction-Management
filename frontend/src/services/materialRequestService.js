import api from './api';

// Create request
const createMaterialRequest = async (requestData) => {
  const { data } = await api.post('/material-requests/request', requestData);
  return data;
};

// Engineer approval
const engineerApproval = async (id, approvalData) => {
  const { data } = await api.put(`/material-requests/${id}/engineer-approval`, approvalData);
  return data;
};

// Contractor approval
const contractorApproval = async (id, approvalData) => {
  const { data } = await api.put(`/material-requests/${id}/contractor-approval`, approvalData);
  return data;
};

// Get all
const getAllMaterialRequests = async (params = {}) => {
  const { data } = await api.get('/material-requests', { params });
  return data;
};

// Get my requests
const getMyMaterialRequests = async () => {
  const { data } = await api.get('/material-requests/my-requests');
  return data;
};

// Get project requests
const getProjectMaterialRequests = async (projectId) => {
  const { data } = await api.get(`/material-requests/project/${projectId}`);
  return data;
};

// Update material request status (legacy)
const updateMaterialRequestStatus = async (id, statusData) => {
  const { data } = await api.put(`/material-requests/${id}`, statusData);
  return data;
};

// Get material requests for Engineer approval
const getEngineerMaterialRequests = async (params = {}) => {
  const { data } = await api.get('/material-requests/engineer/pending', { params });
  return data;
};

// Get material requests for Contractor approval
const getContractorMaterialRequests = async (params = {}) => {
  const { data } = await api.get('/material-requests/contractor/assigned', { params });
  return data;
};

// Update material request status (for contractor)
const updateRequestStatus = async (id, statusData) => {
  const { data } = await api.put(`/material-requests/${id}/status`, statusData);
  return data;
};

export const materialRequestService = {
  createMaterialRequest,
  engineerApproval,
  contractorApproval,
  getAllMaterialRequests,
  getMyMaterialRequests,
  getProjectMaterialRequests,
  updateMaterialRequestStatus,
  getEngineerMaterialRequests,
  getContractorMaterialRequests,
  updateRequestStatus
};
