import api from './axiosConfig';

const authService = {
  // Öğrenci Kaydı
  registerStudent: async (data) => {
    // Backend'deki DTO ile birebir aynı isimleri kullanmalıyız
    return await api.post('/auth/register/student', data);
  },

  // Akademisyen Başvurusu -> BURAYI DÜZELTİYORUZ
  registerAcademician: async (data) => {
    // Eski hatalı url: /auth/register/academician
    // Postman'deki doğru url: /auth/request/academician-account
    return await api.post('/auth/request/academician-account', data);
  }
};

export default authService;