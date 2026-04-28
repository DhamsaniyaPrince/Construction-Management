import api from './api';

const getTasks = async () => {
  const response = await api.get('/tasks');
  return response.data;
};

const createTask = async (taskData) => {
  const payload = {
    title: taskData.title,
    description: taskData.description,
    project: taskData.projectId,
    assignedTo: taskData.assignedTo,
    priority: taskData.priority,
    siteLocation: taskData.siteLocation
  };
  
  console.log("🚀 Sending Task Payload:", payload);
  
  const { data } = await api.post('/tasks', payload);
  return data;
};

const updateTask = async (id, taskData) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
};

export const taskService = {
  getTasks,
  createTask,
  updateTask
};
