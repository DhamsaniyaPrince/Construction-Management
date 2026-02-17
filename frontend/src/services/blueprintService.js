import api from './api';

const getBlueprints = async (projectId) => {
  const url = projectId ? `/blueprints?projectId=${projectId}` : '/blueprints';
  const response = await api.get(url);
  return response.data;
};

const uploadBlueprint = async (blueprintData) => {
  const response = await api.post('/blueprints', blueprintData);
  return response.data;
};

const blueprintService = {
  getBlueprints,
  uploadBlueprint
};

export default blueprintService;
