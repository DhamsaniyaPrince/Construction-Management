import api from './api';

const getTasks = async () => {
  const response = await api.get('/tasks');
  return response.data;
};

const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

const updateTask = async (id, taskData) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
};

const taskService = {
  getTasks,
  createTask,
  updateTask
};

export default taskService;
