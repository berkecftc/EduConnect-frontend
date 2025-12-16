import api from './axiosConfig';

const adminService = {
  // --- 1. AKADEMİSYEN İŞLEMLERİ (Auth Service) ---
  // Bu endpointleri birazdan Backend'de oluşturacağız
  getAcademicianRequests: async () => {
    return await api.get('/auth/admin/requests/academicians'); 
  },
  approveAcademician: async (userId) => {
    return await api.post(`/auth/admin/approve-academician/${userId}`);
  },
  rejectAcademician: async (userId) => {
    return await api.post(`/auth/admin/reject-academician/${userId}`);
  },

  // --- 2. KULÜP BAŞKANI İŞLEMLERİ ---
  getClubOfficialRequests: async () => {
    return await api.get('/auth/admin/pending/club-official');
  },
  approveClubOfficial: async (userId) => {
    return await api.post(`/auth/admin/approve/club-official/${userId}`);
  },
  rejectClubOfficial: async (userId) => {
    return await api.post(`/auth/admin/reject/club-official/${userId}`);
  },

  // --- 3. KULÜP KURMA İSTEKLERİ ---
  getClubCreationRequests: async () => {
    return await api.get('/admin/clubs/request');
  },
  approveClubCreation: async (requestId) => {
    // requestId bazen clubId olabilir, backend yapına göre dikkat et
    return await api.post(`/admin/clubs/requests/${requestId}/approve`);
  },
  // Kulüp silme / güncelleme (Gerekirse panelde kullanırız)
  deleteClub: async (clubId) => {
    return await api.delete(`/admin/clubs/${clubId}`);
  },

  // --- 4. ETKİNLİK İŞLEMLERİ ---
  getEventRequests: async () => {
    return await api.get('/events/manage/pending');
  },
  approveEvent: async (eventId) => {
    return await api.put(`/events/manage/${eventId}/approve`); // Genelde update PUT olur ama POST da olabilir
  },
  rejectEvent: async (eventId) => {
    return await api.put(`/events/manage/${eventId}/reject`);
  }
};

export default adminService;