import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import { jwtDecode } from "jwt-decode"; // <-- 1. YENİ IMPORT

// Login İşlemi
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      localStorage.setItem('token', response.data.token);
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Login failed');
    }
  }
);

// Yardımcı Fonksiyon: Token'dan veri çekme
const decodeToken = (token) => {
    if (!token) return null;
    try {
        return jwtDecode(token); // Token'ı parçalar ve JSON döner
    } catch (error) {
        return null;
    }
};

// Başlangıç State'i (Sayfa yenilendiğinde hafızadan okuma)
const tokenFromStorage = localStorage.getItem('token');
const decodedData = decodeToken(tokenFromStorage);

const initialState = {
  user: decodedData?.sub || null,     // Email veya Username
  role: decodedData?.roles || null,   // Örn: ["ROLE_STUDENT"]
  token: tokenFromStorage || null,
  userId: decodedData?.userId || null, // Backend token'a ID koyduysa buradan gelir
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.role = null;
      state.userId = null;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        
        // --- 2. YENİ KISIM: Login anında token'ı decode et ---
        const decoded = jwtDecode(action.payload.token);
        
        state.user = decoded.sub; // Genelde email
        state.role = decoded.roles; // Backend'deki Claim ismine göre değişir (roles veya authorities)
        state.userId = decoded.userId; // Eğer backend eklediyse
        // ----------------------------------------------------
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;