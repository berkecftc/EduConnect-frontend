import api from './axiosConfig';

const academicianService = {
    // Danışman - Danışmanı olduğu kulüplerin bekleyen etkinliklerini getir
    getPendingEvents: async () => {
        return await api.get('/events/advisor/pending');
    },

    // Danışman - Tüm etkinlikleri getir (danışmanı olduğu kulüpler)
    getAdvisorEvents: async () => {
        return await api.get('/events/advisor/all');
    },

    // Danışman - Etkinlik onayla
    approveEvent: async (eventId) => {
        return await api.post(`/events/advisor/${eventId}/approve`);
    },

    // Danışman - Etkinlik reddet
    rejectEvent: async (eventId) => {
        return await api.post(`/events/advisor/${eventId}/reject`);
    },
};

export default academicianService;
