import api from './axiosConfig';

// ==================== GENEL ====================

// Tüm kulüpleri listele
export const getAllClubs = async () => {
  const response = await api.get('/clubs');
  return response.data;
};

// Öğrenci - Kulüplerim
export const getMyMemberships = async () => {
  const response = await api.get('/clubs/my-memberships');
  return response.data;
};

// Kulüp Yetkilisi - Yönettiğim Kulüpler
export const getMyManagedClubs = async () => {
  const response = await api.get('/clubs/my-managed-clubs');
  return response.data;
};

// Kulüp Yetkilisi - Kulüp Yönetim Kurulu
export const getClubBoardMembers = async (clubId) => {
  const response = await api.get(`/clubs/${clubId}/board-members`);
  return response.data;
};

// ==================== ÖĞRENCİ - ÜYELİK İSTEKLERİ ====================

// Öğrenci - Üyelik isteği gönder
export const sendMembershipRequest = async (clubId) => {
  const response = await api.post(`/clubs/${clubId}/membership-requests`);
  return response.data;
};

// Öğrenci - Kendi isteklerimi görüntüle
export const getMyMembershipRequests = async () => {
  const response = await api.get('/clubs/my-membership-requests');
  return response.data;
};

// Öğrenci - İsteği iptal et
export const cancelMembershipRequest = async (clubId) => {
  const response = await api.delete(`/clubs/${clubId}/membership-requests`);
  return response.data;
};

// ==================== KULÜP BAŞKANI - ÜYELİK İSTEKLERİ ====================

// Kulüp Başkanı - Bekleyen istekleri listele
export const getPendingMembershipRequests = async (clubId) => {
  const response = await api.get(`/clubs/${clubId}/membership-requests/pending`);
  return response.data;
};

// Kulüp Başkanı - Bekleyen istek sayısı
export const getPendingMembershipRequestCount = async (clubId) => {
  const response = await api.get(`/clubs/${clubId}/membership-requests/pending/count`);
  return response.data;
};

// Kulüp Başkanı - Üyelik isteğini onayla
export const approveMembershipRequest = async (clubId, requestId) => {
  const response = await api.put(`/clubs/${clubId}/membership-requests/${requestId}/approve`);
  return response.data;
};

// Kulüp Başkanı - Üyelik isteğini reddet
export const rejectMembershipRequest = async (clubId, requestId) => {
  const response = await api.put(`/clubs/${clubId}/membership-requests/${requestId}/reject`);
  return response.data;
};
