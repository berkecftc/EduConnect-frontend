import axios from 'axios';

// API Gateway adresimiz
const api = axios.create({
  baseURL: 'http://localhost:8080/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Her isteğe Token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Token'ı browser hafızasından al
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;