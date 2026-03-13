import api from './api';

export const attendanceService = {
  mark: async (attendanceData) => {
    const { data } = await api.post('/attendance', attendanceData);
    return data;
  },
  getWorkerAttendance: async (workerId, params = {}) => {
    const { data } = await api.get(`/attendance/worker/${workerId}`, { params });
    return data;
  },
  getProjectAttendance: async (projectId, params = {}) => {
    const { data } = await api.get(`/attendance/project/${projectId}`, { params });
    return data;
  },
  getSummary: async (projectId, date) => {
    const { data } = await api.get(`/attendance/project/${projectId}/summary`, { params: { date } });
    return data;
  },
};



