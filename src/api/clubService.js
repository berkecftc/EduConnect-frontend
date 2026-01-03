import api from './axiosConfig';

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
