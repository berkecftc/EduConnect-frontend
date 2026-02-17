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

    // ==================== GÖREV DEĞİŞİKLİĞİ TALEPLERİ ====================

    // Danışman - Bekleyen görev değişikliği taleplerini listele
    getPendingRoleChangeRequests: async () => {
        return await api.get('/academician/role-change-requests');
    },

    // Danışman - Görev değişikliği talebini onayla
    approveRoleChangeRequest: async (requestId) => {
        return await api.put(`/academician/role-change-requests/${requestId}/approve`);
    },

    // Danışman - Görev değişikliği talebini reddet
    rejectRoleChangeRequest: async (requestId, data = {}) => {
        return await api.put(`/academician/role-change-requests/${requestId}/reject`, data);
    },

    // Danışman - Belirli bir kulübün bekleyen talep sayısı
    getRoleChangeRequestCount: async (clubId) => {
        return await api.get(`/academician/clubs/${clubId}/role-change-requests/count`);
    },
};

export default academicianService;

