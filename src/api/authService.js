import api from './axiosConfig';

const authService = {
  // Öğrenci Kaydı
  registerStudent: async (data) => {
    // Backend'deki DTO ile birebir aynı isimleri kullanmalıyız
    return await api.post('/auth/register/student', data);
  },

  // Akademisyen Başvurusu (İleride lazım olacak)
  registerAcademician: async (data) => {
    return await api.post('/auth/register/academician', data);
  }
};

export default authService;