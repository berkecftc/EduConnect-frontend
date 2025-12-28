import api from './axiosConfig';

// Öğrenci - Etkinliklerim
export const getMyRegistrations = async () => {
  const response = await api.get('/events/my-registrations');
  return response.data;
};
