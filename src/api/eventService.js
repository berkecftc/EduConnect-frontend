import api from './axiosConfig';

// Öğrenci - Etkinliklerim
export const getMyRegistrations = async () => {
  const response = await api.get('/events/my-registrations');
  return response.data;
};

// Kulüp Yetkilisi - Oluşturduğum Etkinlikler
export const getMyEvents = async () => {
  const response = await api.get('/events/manage/my-events');
  return response.data;
};

// Kulüp Yetkilisi - Etkinliğe Kayıtlılar
export const getEventRegistrations = async (eventId) => {
  const response = await api.get(`/events/manage/${eventId}/registrations`);
  return response.data;
};

// Kulüp Yetkilisi - Etkinlik Oluştur
export const createEvent = async (formData) => {
  // Use fetch API instead of axios for FormData to avoid Content-Type issues
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:8080/api/events/manage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type - browser will set it with boundary automatically
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Etkinlik oluşturulamadı');
  }

  return await response.json();
};

// Kulüp Yetkilisi - QR Kod Doğrula
export const verifyQrCode = async (qrData) => {
  const response = await api.post('/events/manage/verify-qr', qrData);
  return response.data;
};
