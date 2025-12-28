import api from './axiosConfig';

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

// Akademisyen - Öğrenciyi Kursa Ekle
export const enrollStudentToCourse = async (courseId, studentData) => {
  const response = await api.post(`/courses/${courseId}/enroll-student`, studentData);
  return response.data;
};
