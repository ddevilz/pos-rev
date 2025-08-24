import axios from 'axios';
import { store } from '@/store';
import { logout, updateTokens } from '@/store/slices/authSlice';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and session management
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data.data;
        
        // Update both localStorage and Redux state
        const tokenData = {
          access_token,
          refresh_token: newRefreshToken,
          token_type: 'Bearer',
          expires_in: 3600,
        };

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', newRefreshToken);
        store.dispatch(updateTokens(tokenData));

        // Retry original request with new token
        original.headers.Authorization = `Bearer ${access_token}`;
        return api(original);
      } catch (refreshError) {
        // Refresh failed, logout user and redirect to login
        handleSessionExpiry();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle session expiry
const handleSessionExpiry = () => {
  // Clear Redux state
  store.dispatch(logout());
  
  // Clear any remaining localStorage data
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  
  // Redirect to login page
  window.location.href = '/auth/login';
};

export default api;
export { handleSessionExpiry };