// backend/lib/apiClient.js

import axios from 'axios';

// Create an Axios instance with default config
const apiClient = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to inject admin API key for authenticated requests
apiClient.interceptors.request.use(
  (config) => {
    // Debug info about environment variables
    console.log('API Key available:', !!process.env.NEXT_PUBLIC_ADMIN_API_KEY);
    if (!process.env.NEXT_PUBLIC_ADMIN_API_KEY) {
      console.warn('NEXT_PUBLIC_ADMIN_API_KEY is not defined in the environment');
    }
    
    // Add authorization header with API key for all requests
    config.headers['Authorization'] = `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`;
    console.log('Authorization header set:', `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY?.substring(0, 3)}...`);
    return config;
  },
  (error) => {
    console.error('Error in request interceptor:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      if (error.response.status === 401) {
        console.error('Unauthorized request. API key might be missing or invalid.');
      } else if (error.response.status === 403) {
        console.error('Forbidden. You do not have permission to access this resource.');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
