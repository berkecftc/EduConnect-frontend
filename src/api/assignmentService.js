import api from './axiosConfig';

// ==================== AKADEMİSYEN ====================

// Akademisyen - Ödev Oluştur (multipart/form-data: JSON + dosya)
export const createAssignment = async (assignmentData, file) => {
  const formData = new FormData();
  formData.append('assignment', new Blob([JSON.stringify(assignmentData)], { type: 'application/json' }));
  if (file) {
    formData.append('file', file);
  }
  const response = await api.post('/assignments', formData);
  return response.data;
};

// Akademisyen - Derse ait ödevleri listele
export const getCourseAssignments = async (courseId) => {
  const response = await api.get(`/assignments/course/${courseId}`);
  return response.data;
};

// Akademisyen - Ödev sil
export const deleteAssignment = async (assignmentId) => {
  const response = await api.delete(`/assignments/${assignmentId}`);
  return response.data;
};

// Akademisyen - Dersteki tüm teslimleri görme
export const getCourseSubmissions = async (courseId) => {
  const response = await api.get(`/assignments/course/${courseId}/submissions`);
  return response.data;
};

// Akademisyen - Belirli ödevin teslimlerini görme
export const getAssignmentSubmissions = async (assignmentId) => {
  const response = await api.get(`/assignments/${assignmentId}/submissions`);
  return response.data;
};

// Akademisyen - Not ver
export const gradeSubmission = async (submissionId, gradeData) => {
  const response = await api.put(`/assignments/submissions/${submissionId}/grade`, gradeData);
  return response.data;
};

// ==================== ÖĞRENCİ ====================

// Öğrenci - Ödevlerim (X-Authenticated-User-Id header gerektirir)
export const getMyAssignments = async () => {
  const userId = localStorage.getItem('userId');
  const response = await api.get('/assignments/my-assignments', {
    headers: userId ? { 'X-Authenticated-User-Id': userId } : {},
  });
  return response.data;
};

// Öğrenci - Ödev teslim et (multipart/form-data, file partı, X-Authenticated-User-Id header gerektirir)
export const submitAssignment = async (assignmentId, file) => {
  const userId = localStorage.getItem('userId');
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/assignments/${assignmentId}/submit`, formData, {
    headers: {
      ...(userId ? { 'X-Authenticated-User-Id': userId } : {}),
    },
  });
  return response.data;
};

// ==================== DOSYA İŞLEMLERİ ====================

// Ödev dokümanı / teslim dosyası indirme
export const downloadAssignmentFile = async (fileUrl) => {
  const response = await api.get('/assignments/files/download', {
    params: { url: fileUrl },
    responseType: 'blob',
  });
  return response;
};
