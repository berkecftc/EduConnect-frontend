import api from './axiosConfig';

const authService = {
  // Öğrenci Başvurusu (multipart/form-data)
  // POST /api/auth/request/student-account
  // Parts: request (JSON), studentDocument (File)
  registerStudent: async (data) => {
    console.log('========== STUDENT REGISTRATION REQUEST ==========');
    console.log('URL: /auth/request/student-account');
    console.log('Data type:', data instanceof FormData ? 'FormData' : typeof data);

    if (data instanceof FormData) {
      for (let [key, value] of data.entries()) {
        if (value instanceof Blob) {
          console.log(`FormData part [${key}]:`, {
            type: value.type,
            size: value.size,
            isFile: value instanceof File,
            fileName: value instanceof File ? value.name : 'Blob'
          });
          // JSON blob içeriğini oku
          if (value.type === 'application/json') {
            const text = await value.text();
            console.log(`FormData part [${key}] JSON content:`, JSON.parse(text));
          }
        } else {
          console.log(`FormData part [${key}]:`, value);
        }
      }
    } else {
      console.log('Data:', data);
    }

    const config = {};
    if (data instanceof FormData) {
      config.headers = {
        'Content-Type': 'multipart/form-data'
      };
    }
    console.log('Config:', config);

    try {
      const response = await api.post('/auth/request/student-account', data, config);
      console.log('✅ Student registration SUCCESS:', response.status, response.data);
      return response;
    } catch (error) {
      console.error('❌ Student registration FAILED');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', error.response?.data);
      console.error('Response Headers:', error.response?.headers);
      console.error('Full Error:', error);
      throw error;
    }
  },

  // Akademisyen Başvurusu (multipart/form-data)
  // POST /api/auth/request/academician-account
  // Parts: request (JSON), idCardImage (File)
  registerAcademician: async (data) => {
    console.log('========== ACADEMICIAN REGISTRATION REQUEST ==========');
    console.log('URL: /auth/request/academician-account');
    console.log('Data type:', data instanceof FormData ? 'FormData' : typeof data);

    if (data instanceof FormData) {
      for (let [key, value] of data.entries()) {
        if (value instanceof Blob) {
          console.log(`FormData part [${key}]:`, {
            type: value.type,
            size: value.size,
            isFile: value instanceof File,
            fileName: value instanceof File ? value.name : 'Blob'
          });
          if (value.type === 'application/json') {
            const text = await value.text();
            console.log(`FormData part [${key}] JSON content:`, JSON.parse(text));
          }
        } else {
          console.log(`FormData part [${key}]:`, value);
        }
      }
    }

    const config = {};
    if (data instanceof FormData) {
      config.headers = {
        'Content-Type': 'multipart/form-data'
      };
    }
    console.log('Config:', config);

    try {
      const response = await api.post('/auth/request/academician-account', data, config);
      console.log('✅ Academician registration SUCCESS:', response.status, response.data);
      return response;
    } catch (error) {
      console.error('❌ Academician registration FAILED');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', error.response?.data);
      console.error('Response Headers:', error.response?.headers);
      console.error('Full Error:', error);
      throw error;
    }
  }
};

export default authService;