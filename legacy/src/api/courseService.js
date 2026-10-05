import api from './axiosConfig';

// ==================== KURSLAR ====================

// Tüm dersler (öğrenci başvurusu için)
export const getAllCourses = async () => {
  const response = await api.get('/courses');
  return response.data;
};

// Öğrenci - Kurslarım
export const getMyCourses = async () => {
  const response = await api.get('/courses/my-courses');
  return response.data;
};

// Akademisyen - Derslerim
export const getInstructorCourses = async () => {
  const response = await api.get('/courses/instructor/me/courses');
  return response.data;
};

// Akademisyen - Ders Oluştur (multipart/form-data: JSON + resim)
export const createCourse = async (courseData, file) => {
  const formData = new FormData();
  formData.append('course', new Blob([JSON.stringify(courseData)], { type: 'application/json' }));
  if (file) {
    formData.append('file', file);
  }
  const response = await api.post('/courses', formData);
  return response.data;
};

// Akademisyen - Öğrenciyi Kursa Ekle
export const enrollStudentToCourse = async (courseId, studentData) => {
  const response = await api.post(`/courses/${courseId}/enroll-student`, studentData);
  return response.data;
};

// ==================== BAŞVURULAR (Applications) ====================

// Öğrenci - Derse Başvuru Yap
export const applyToCourse = async (courseId) => {
  const response = await api.post(`/courses/${courseId}/apply`);
  return response.data;
};

// Hoca - Bekleyen Başvuruları Listele (FCFS sıralı)
export const getPendingApplications = async (courseId) => {
  const response = await api.get(`/courses/${courseId}/applications/pending`);
  return response.data;
};

// Hoca - Başvuruyu Onayla
export const approveApplication = async (applicationId) => {
  const response = await api.put(`/courses/applications/${applicationId}/approve`);
  return response.data;
};

// Hoca - Başvuruyu Reddet
export const rejectApplication = async (applicationId, reason) => {
  const response = await api.put(`/courses/applications/${applicationId}/reject`, { reason });
  return response.data;
};

// Öğrenci - Kendi Başvurularını Gör
export const getMyApplications = async () => {
  const response = await api.get('/courses/my-applications');
  return response.data;
};

// ==================== DUYURULAR (Announcements) ====================

// Hoca - Duyuru Paylaş
export const createAnnouncement = async (courseId, announcementData) => {
  const response = await api.post(`/courses/${courseId}/announcements`, announcementData);
  return response.data;
};

// Duyuruları Listele
export const getAnnouncements = async (courseId) => {
  const response = await api.get(`/courses/${courseId}/announcements`);
  return response.data;
};

// Hoca - Duyuru Sil
export const deleteAnnouncement = async (announcementId) => {
  const response = await api.delete(`/courses/announcements/${announcementId}`);
  return response.data;
};

// ==================== KAYITLI ÖĞRENCİLER ====================

// Hoca - Kayıtlı Öğrenci Listesi (detaylı)
export const getEnrolledStudents = async (courseId) => {
  const response = await api.get(`/courses/${courseId}/enrolled-students`);
  return response.data;
};

// ==================== DOSYA İNDİRME ====================

// Course dosyası indirme
export const downloadCourseFile = async (fileUrl) => {
  const response = await api.get(`/courses/files/download`, {
    params: { url: fileUrl },
    responseType: 'blob',
  });
  return response;
};
