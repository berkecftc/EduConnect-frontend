import api from './axiosConfig';

// Öğrenci - Kulüplerim
export const getMyMemberships = async () => {
  const response = await api.get('/clubs/my-memberships');
  return response.data;
};
