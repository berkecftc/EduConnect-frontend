import api from './axiosConfig';

export const sendInstructorMessage = async (message) => {
  const response = await api.post('/ai/instructor-copilot', { message });
  return response.data;
};

export const sendStudentMessage = async (message) => {
  const response = await api.post('/ai/student-assistant', { message });
  return response.data;
};

export const sendClubMessage = async (message) => {
  const response = await api.post('/ai/club-assistant', { message });
  return response.data;
};
