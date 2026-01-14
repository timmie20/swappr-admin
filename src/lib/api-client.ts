import axios from 'axios';

const API_BASE_URL = process.env.NEXT_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from Clerk - this will be set up when making requests from client components
    // The token should be passed via headers in the service layer
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - could trigger logout or token refresh
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('Unauthorized access');
          }
          break;
        case 403:
          // Forbidden
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('Access forbidden');
          }
          break;
        case 404:
          // Not found
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('Resource not found');
          }
          break;
        case 422:
          // Validation error
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('Validation error:', data);
          }
          break;
        case 500:
          // Server error
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('Server error');
          }
          break;
        default:
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('API error:', data);
          }
      }
    } else if (error.request) {
      // Request made but no response received
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('No response from server');
      }
    } else {
      // Error in request setup
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Request setup error:', error.message);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
