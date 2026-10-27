// backend/lib/apiClient.js

import axios from 'axios';

// Same-origin requests carry the Better Auth session cookie, which adminAuth accepts.
const apiClient = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      if (error.response.status === 401) {
        console.error('Unauthorized request. Session may have expired.');
      } else if (error.response.status === 403) {
        console.error('Forbidden. You do not have permission to access this resource.');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
