import api from './api';

export const attendanceService = {
  // Get all attendance records
  getAll: async (params = {}) => {
    const { data } = await api.get('/attendance', { params });
    return data;
  },
  
  // Original methods
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

  // New methods for enhanced functionality
  getAttendanceStats: async (params = {}) => {
    const { data } = await api.get('/attendance/stats', { params });
    return data;
  },
  getDailyStrength: async (params = {}) => {
    const { data } = await api.get('/attendance/analytics/daily-strength', { params });
    return data;
  },
  getLaborDistribution: async (params = {}) => {
    const { data } = await api.get('/attendance/analytics/labor-distribution', { params });
    return data;
  },
  getAttendanceSummary: async (projectId, params = {}) => {
    const { data } = await api.get(`/attendance/project/${projectId}/summary`, { params });
    return data;
  },
  bulkMarkAttendance: async (bulkData) => {
    const { data } = await api.post('/attendance/bulk', bulkData);
    return data;
  },
  updateAttendance: async (id, updateData) => {
    const { data } = await api.put(`/attendance/${id}`, updateData);
    return data;
  },
};



