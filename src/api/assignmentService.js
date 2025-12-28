import api from './axiosConfig';

// Öğrenci - Ödevlerim
export const getMyAssignments = async () => {
  const response = await api.get('/assignments/my-assignments');
  return response.data;
};

// Akademisyen - Kursa ait teslimleri görüntüle
export const getCourseSubmissions = async (courseId) => {
  const response = await api.get(`/assignments/course/${courseId}/submissions`);
  return response.data;
};

// Akademisyen - Not ver
export const gradeSubmission = async (submissionId, gradeData) => {
  const response = await api.put(`/assignments/submissions/${submissionId}/grade`, gradeData);
  return response.data;
};
