import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login:    (data) => api.post('/api/auth/login', data),
};

// ─── Current user ────────────────────────────────────────
export const userAPI = {
  getMe: () => api.get('/api/users/me'),
};

// ─── Fund Requests ───────────────────────────────────────
export const fundRequestAPI = {
  getAll:      ()         => api.get('/api/fund-requests'),        // public browse
  getById:     (id)       => api.get(`/api/fund-requests/${id}`),
  getMy:       ()         => api.get('/api/fund-requests/my'),
  create:      (data)     => api.post('/api/fund-requests', data), // includes emergency flag
  delete:      (id)       => api.delete(`/api/fund-requests/${id}`),
};

// ─── Donations ───────────────────────────────────────────
export const donationAPI = {
  donate:      (data) => api.post('/api/donations', data),
  getMy:       ()     => api.get('/api/donations/my'),
  getReceived: ()     => api.get('/api/donations/received'),
  getAll:      ()     => api.get('/api/donations'),
  getById:     (id)   => api.get(`/api/donations/${id}`),
  delete:      (id)   => api.delete(`/api/donations/${id}`),   // admin only
};

// ─── Notifications ───────────────────────────────────────
export const notificationAPI = {
  getAll:      () => api.get('/api/notifications'),
  markAllRead: () => api.put('/api/notifications/read-all'),
  countUnread: () => api.get('/api/notifications/unread-count'),
};

// ─── Admin ───────────────────────────────────────────────
export const adminAPI = {
  getDashboard:    ()           => api.get('/api/admin/dashboard'),
  getAllUsers:      ()           => api.get('/api/admin/users'),
  getUsersByRole:  (role)       => api.get(`/api/admin/users/role/${role}`),
  updateRole:      (id, role)   => api.put(`/api/admin/users/${id}/role`, { role }),
  verifyUser:      (id)         => api.put(`/api/admin/users/${id}/verify`),
  deleteUser:      (id)         => api.delete(`/api/admin/users/${id}`),
  // Fund requests
  getFundRequests: (status)     => api.get('/api/admin/fund-requests', { params: { status } }),
  reviewRequest:   (id, data)   => api.put(`/api/admin/fund-requests/${id}/review`, data),
  flagRequest:     (id, data)   => api.put(`/api/admin/fund-requests/${id}/flag`, data),
  // Emergency access management
  lockEmergency:   (id, data)   => api.put(`/api/admin/users/${id}/emergency-lock`, data),
  unlockEmergency: (id)         => api.put(`/api/admin/users/${id}/emergency-unlock`),
};

export default api;
