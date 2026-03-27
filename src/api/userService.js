import api from './axiosConfig';

export const getUserProfileAggregated = async (userId) => {
  const response = await api.get(`/users/profile/${userId}/aggregated`);
  return response.data;
};

export const updateUserProfile = async (userId, profileData, file) => {
  const formData = new FormData();

  // Send the JSON as a Blob to satisfy @RequestPart
  // We use 'data' since the backend checks dataJson first.
  formData.append('data', new Blob([JSON.stringify(profileData || {})], { type: 'application/json' }));
  
  // As a fallback, also send fields as simple @RequestParam values since the backend supports them
  if (profileData.firstName) formData.append('firstName', profileData.firstName);
  if (profileData.lastName) formData.append('lastName', profileData.lastName);
  if (profileData.department) formData.append('department', profileData.department);
  if (profileData.bio) formData.append('bio', profileData.bio);

  if (file) {
    // Backend accepts @RequestPart("file", required = false) MultipartFile file
    formData.append('file', file);
  }

  const response = await api.put(`/users/profile/${userId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};
