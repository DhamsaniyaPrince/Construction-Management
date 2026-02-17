import api from './api';

const getNotifications = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/notifications?${queryString}`);
  return response.data;
};

const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

const markAllAsRead = async () => {
  const response = await api.patch('/notifications/mark-all-read');
  return response.data;
};

const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};

export default notificationService;
