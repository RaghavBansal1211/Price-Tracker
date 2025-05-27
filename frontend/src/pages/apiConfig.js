import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Add a request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');  // get token from storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;  // add Bearer token header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
