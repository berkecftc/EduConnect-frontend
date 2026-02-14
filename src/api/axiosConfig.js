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

// Response Interceptor: 401 hatalarını yakala ve login'e yönlendir
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🔴 Axios Error Interceptor:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      // Token geçersiz veya süresi dolmuş
      const currentPath = window.location.pathname;

      // Register ve login sayfasında redirect yapma (logları kaybetmemek için)
      if (currentPath === '/register' || currentPath === '/login') {
        console.warn('⚠️ 401 on auth page, NOT redirecting. URL:', error.config?.url);
        return Promise.reject(error);
      }

      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('role');

      // Login sayfasına yönlendir (sayfa yenilemesi ile)
      console.warn('🔄 401 detected, redirecting to /login from:', currentPath);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;