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
    return await api.get('/admin/clubs/requests');
  },
  approveClubCreation: async (requestId) => {
    // requestId bazen clubId olabilir, backend yapına göre dikkat et
    return await api.post(`/admin/clubs/requests/${requestId}/approve`);
  },
  // YENİ EKLENEN KISIM:
  rejectClubCreation: async (requestId) => {
    return await api.post(`/admin/clubs/requests/${requestId}/reject`);
  },
  // Kulüp silme / güncelleme (Gerekirse panelde kullanırız)
  deleteClub: async (clubId) => {
    return await api.delete(`/admin/clubs/${clubId}`);
  },
  getAllActiveClubs: async () => {
    return await api.get('/admin/clubs/active');
  },
  getClubBoardMembers: async (clubId) => {
    return await api.get(`/admin/clubs/${clubId}/board`);
  },
  changeClubPresident: async (clubId, newPresidentId) => {
    return await api.put(`/admin/clubs/${clubId}/change-president?newPresidentId=${newPresidentId}`);
  },
  // LOGO GÜNCELLEME (Admin Endpointine İstek Atar)
  updateClubLogo: async (clubId, file) => {
    const formData = new FormData();
    formData.append('file', file); // Backend'deki @RequestParam("file") ile aynı isim olmalı

    // DİKKAT: /admin/clubs/{clubId}/logo adresine atıyoruz
    return await api.post(`/admin/clubs/${clubId}/logo`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data' 
        }
    });
  },

  // --- 4. ETKİNLİK İŞLEMLERİ ---
  // Tüm Etkinlikleri Getir (İstatistik için)
  getAllEvents: async () => {
    // Event Service'in public endpointi veya admin endpointi
    return await api.get('/events/admin/all');
  },
  getEventRequests: async () => {
    return await api.get('/events/manage/pending');
  },
  approveEvent: async (eventId) => {
    return await api.post(`/events/manage/${eventId}/approve`); // Genelde update PUT olur ama POST da olabilir
  },
  rejectEvent: async (eventId) => {
    return await api.post(`/events/manage/${eventId}/reject`);
  },
  // --- 5. GENEL KULLANICI YÖNETİMİ ---
  getAllUsers: async () => {
    return await api.get('/auth/admin/users');
  },
  deleteUser: async (userId) => {
    return await api.delete(`/auth/admin/users/${userId}`);
  },

  // --- 6. PASİF/SİLİNMİŞ KAYITLAR ---
  getInactiveClubs: async () => {
    return await api.get('/admin/clubs/archived');
  },
  getInactiveStudents: async () => {
    return await api.get('/users/students/archived');
  },
  getInactiveAcademicians: async () => {
    return await api.get('/users/academicians/archived');
  },
};

export default adminService;