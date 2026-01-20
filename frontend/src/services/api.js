import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('smartscrub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.message || 'An error occurred';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// API methods
export const uploadAPI = {
  uploadDataset: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  listDatasets: async () => {
    return api.get('/datasets');
  },
};

export const profileAPI = {
  getProfile: async (datasetId) => {
    return api.get(`/profile/${datasetId}`);
  },
  
  getColumnProfile: async (datasetId, columnName) => {
    return api.get(`/profile/${datasetId}/column/${columnName}`);
  },
  
  getPreview: async (datasetId, rows = 10) => {
    return api.get(`/profile/${datasetId}/preview?rows=${rows}`);
  },
};

export const cleanAPI = {
  applyManualCleaning: async (datasetId, cleaningRequest) => {
    return api.post(`/clean/manual/${datasetId}`, cleaningRequest);
  },
  
  getAutoSuggestions: async (datasetId, autoCleanRequest = {}) => {
    return api.post(`/clean/auto/${datasetId}`, {
      confidence_threshold: 0.7,
      max_suggestions: 10,
      ...autoCleanRequest,
    });
  },
  
  applySuggestions: async (datasetId, applyRequest) => {
    return api.post(`/clean/apply/${datasetId}`, applyRequest);
  },
  
  getStoredSuggestions: async (datasetId) => {
    return api.get(`/clean/suggestions/${datasetId}`);
  },
  
  clearSuggestions: async (datasetId) => {
    return api.delete(`/clean/suggestions/${datasetId}`);
  },
};

export const exportAPI = {
  exportDataset: async (datasetId, exportRequest = {}) => {
    const response = await axios.post(
      `${api.defaults.baseURL}/export/${datasetId}`,
      {
        format: 'csv',
        include_metadata: false,
        ...exportRequest,
      },
      {
        responseType: 'blob',
        timeout: 30000,
      }
    );
    
    return response;
  },
  
  getExportInfo: async (datasetId) => {
    return api.get(`/export/${datasetId}/info`);
  },
  
  getExportPreview: async (datasetId, format = 'csv', rows = 5) => {
    return api.get(`/export/${datasetId}/preview?format=${format}&rows=${rows}`);
  },
};

export const authAPI = {
  register: async (userData) => {
    return api.post('/auth/register', userData);
  },
  
  login: async (credentials) => {
    return api.post('/auth/login', credentials);
  },
  
  logout: async () => {
    return api.post('/auth/logout');
  },
  
  getCurrentUser: async () => {
    return api.get('/auth/me');
  },
  
  checkAuth: async () => {
    return api.get('/auth/check');
  },
};