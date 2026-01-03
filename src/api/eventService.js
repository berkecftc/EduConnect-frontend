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
export const createEvent = async (eventData) => {
  const formData = new FormData();
  
  // Backend 'data' part'ı bekliyor - JSON string olarak gönder
  formData.append('data', new Blob([JSON.stringify(eventData)], { type: 'application/json' }));

  const response = await api.post('/events/manage', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Kulüp Yetkilisi - QR Kod Doğrula
export const verifyQrCode = async (qrData) => {
  const response = await api.post('/events/manage/verify-qr', qrData);
  return response.data;
};
