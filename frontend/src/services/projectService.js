import api from './api';

export const projectService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/projects', { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },
  create: async (projectData) => {
    const { data } = await api.post('/projects', projectData);
    return data;
  },
  update: async (id, projectData) => {
    const { data } = await api.put(`/projects/${id}`, projectData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/projects/${id}`);
    return data;
  },
  assignEngineers: async (id, engineerIds) => {
    const { data } = await api.post(`/projects/${id}/assign-engineers`, { engineerIds });
    return data;
  },
  addMilestone: async (id, milestone) => {
    const { data } = await api.post(`/projects/${id}/milestones`, milestone);
    return data;
  },
  updateMilestone: async (id, milestoneId, milestone) => {
    const { data } = await api.put(`/projects/${id}/milestones/${milestoneId}`, milestone);
    return data;
  },
  removeMilestone: async (id, milestoneId) => {
    const { data } = await api.delete(`/projects/${id}/milestones/${milestoneId}`);
    return data;
  },
};



