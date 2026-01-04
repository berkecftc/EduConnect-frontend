import api from './axiosConfig';

// Öğrenci - Etkinliklerim
export const getMyRegistrations = async () => {
  try {
    console.log('Etkinlikler getiriliyor: GET /api/events/my-registrations');
    const response = await api.get('/events/my-registrations');
    console.log('Etkinlikler API yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Etkinlikler API hatası:', error.response?.data || error.message);
    throw error;
  }
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

// Öğrenci/Genel - Kulüp etkinliklerini görüntüle
export const getClubEvents = async (clubId) => {
  try {
    console.log(`Kulüp etkinlikleri getiriliyor: GET /api/events/club/${clubId}`);
    const response = await api.get(`/events/club/${clubId}`);
    console.log('Kulüp etkinlikleri yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Kulüp etkinlikleri API hatası:', error.response?.data || error.message);
    throw error;
  }
};

// Öğrenci - Tüm kulüp etkinliklerini görüntüle (üye olunan kulüpler)
export const getAllClubEvents = async () => {
  try {
    console.log('Tüm kulüp etkinlikleri getiriliyor: GET /api/events/clubs/all');
    const response = await api.get('/events/clubs/all');
    console.log('Tüm kulüp etkinlikleri yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Tüm kulüp etkinlikleri API hatası:', error.response?.data || error.message);
    throw error;
  }
};

// ==================== ÖĞRENCİ - KATILIM İSTEKLERİ ====================

// Öğrenci - Katılım isteği gönder
export const sendParticipationRequest = async (eventId) => {
  const response = await api.post(`/events/${eventId}/participation-request`);
  return response.data;
};

// Öğrenci - Kendi katılım isteklerimi görüntüle
export const getMyParticipationRequests = async () => {
  const response = await api.get('/events/my-participation-requests');
  return response.data;
};

// ==================== KULÜP YETKİLİSİ - KATILIM İSTEKLERİ ====================

// Kulüp Yetkilisi - Belirli etkinliğin bekleyen istekleri
export const getPendingParticipationRequests = async (eventId) => {
  const response = await api.get(`/events/${eventId}/participation-requests/pending`);
  return response.data;
};

// Kulüp Yetkilisi - Belirli etkinliğin tüm istekleri
export const getAllParticipationRequests = async (eventId) => {
  const response = await api.get(`/events/${eventId}/participation-requests`);
  return response.data;
};

// Kulüp Yetkilisi - Tüm etkinliklerimin bekleyen istekleri
export const getAllMyPendingRequests = async () => {
  const response = await api.get('/events/official/pending-requests');
  return response.data;
};

// Kulüp Yetkilisi - Katılım isteğini onayla
export const approveParticipationRequest = async (requestId) => {
  const response = await api.post(`/events/participation-requests/${requestId}/approve`);
  return response.data;
};

// Kulüp Yetkilisi - Katılım isteğini reddet
export const rejectParticipationRequest = async (requestId) => {
  const response = await api.post(`/events/participation-requests/${requestId}/reject`);
  return response.data;
};
