import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.txt-me.club/prod';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления Authorization header с JWT токеном
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Глобальный обработчик для показа модального окна
let authModalHandler = null;

export const setAuthModalHandler = (handler) => {
  authModalHandler = handler;
};

// Interceptor для обработки 401 ошибок
api.interceptors.response.use(
  (response) => response,
                              (error) => {
                                if (error.response && error.response.status === 401) {
                                  localStorage.removeItem('token');
                                  localStorage.removeItem('userId');
                                  localStorage.removeItem('username');
                                  localStorage.removeItem('role');

                                  if (authModalHandler) {
                                    authModalHandler();
                                  }

                                  error.sessionExpired = true;
                                }
                                return Promise.reject(error);
                              }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const postsAPI = {
  getAll: (params) => api.get('/posts', { params }),
  getById: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
};

export const commentsAPI = {
  getByPost: (postId) => api.get(`/posts/${postId}/comments`),
  create: (postId, data) => api.post(`/posts/${postId}/comments`, data),
  delete: (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`),
  update: (postId, commentId, data) => api.put(`/posts/${postId}/comments/${commentId}`, data),
};


// API для управления профилем
export const profileAPI = {
  getProfile: () => api.get('/admin/users/profile'),
  updateEmail: (email) => api.put('/admin/users/profile/email', { email }),
  deleteEmail: () => api.delete('/admin/users/profile/email'),
  updatePassword: (oldPassword, newPassword) => api.put('/admin/users/profile/password', { oldPassword, newPassword }),

  // Avatar management (ДОБАВЛЕНО)
  addAvatar: (dataUrl) => api.post('/admin/users/profile/avatar', { dataUrl }),
  deleteAvatar: (avatarId) => api.delete(`/admin/users/profile/avatar/${avatarId}`),
  setActiveAvatar: (avatarId) => api.put(`/admin/users/profile/avatar/active/${avatarId}`),
  getUserAvatar: (userId) => api.get(`/admin/users/${userId}/avatar`),
};

export default api;
