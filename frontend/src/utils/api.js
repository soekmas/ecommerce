import axios from 'axios';

export const SERVER_URL = `http://${window.location.hostname}:8080`;

const api = axios.create({
  baseURL: `${SERVER_URL}/api/v1`,
});

// Helper to resolve image URLs
export const getFullUrl = (path) => {
  if (!path) return '';
  
  // 1. If it's already a full URL, return as is
  if (path.startsWith('http')) return path;
  
  // 2. If it's an Unsplash ID (starts with photo-), prepend Unsplash base
  if (path.startsWith('photo-')) {
    return `https://images.unsplash.com/${path}`;
  }
  
  // 3. Local path: Ensure it starts with / and prepend SERVER_URL
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_URL}${cleanPath}`;
};

// Attach JWT token to every request automatically if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors (Unauthorized/Expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
