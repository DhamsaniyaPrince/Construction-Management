import api from "./api";

export const projectService = {

  getProjects: async (params = {}) => {
    const { data } = await api.get("/projects", { params });
    console.log("🔍 Raw API response:", data);
    console.log("🔍 Data property:", data.data);
    
    // Return the projects array with safe ID mapping
    const projects = (data.data || []).map(project => ({
      ...project,
      _id: project._id || project.id
    }));
    
    console.log("🔍 Mapped projects:", projects);
    return projects;
  },

  getById: async (id) => {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },

  createProject: async (projectData) => {
    console.log("🚀 projectService.createProject called with:", projectData);
    console.log("🚀 Payload keys:", Object.keys(projectData));
    console.log("🚀 About to POST to /projects");
    try {
      const { data } = await api.post("/projects", projectData);
      console.log("🚀 API response status:", data?.status || 'no status');
      console.log("🚀 API response data:", data);
      return data;
    } catch (error) {
      console.error("🚀 API error:", error);
      console.error("🚀 Error response:", error?.response);
      console.error("🚀 Error status:", error?.response?.status);
      console.error("🚀 Error data:", error?.response?.data);
      throw error;
    }
  },

  updateProject: async (id, projectData) => {
    const { data } = await api.put(`/projects/${id}`, projectData);
    return data;
  },

  deleteProject: async (id) => {
    const { data } = await api.delete(`/projects/${id}`);
    return data;
  },

  assignEngineers: async (id, engineerIds) => {
    const { data } = await api.post(`/projects/${id}/assign-engineers`, {
      engineers: engineerIds
    });
    return data;
  },

  assignSiteManagers: async (id, siteManagerIds) => {
    const { data } = await api.post(`/projects/${id}/assign-site-managers`, {
      siteManagers: siteManagerIds
    });
    return data;
  },

  getAssignedProjects: async (params = {}) => {
    const { data } = await api.get("/projects/assigned", { params });
    console.log("🔍 Assigned projects API response:", data);
    
    // Return the projects array with safe ID mapping
    const projects = (data.data || []).map(project => ({
      ...project,
      _id: project._id || project.id
    }));
    
    console.log("🔍 Mapped assigned projects:", projects);
    return projects;
  }
};