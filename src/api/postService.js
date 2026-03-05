import api from './axiosConfig';

// Yayınlanmış postları sayfalı listele
export const getPosts = async (page = 0, size = 10, sort = 'createdAt,desc') => {
    const response = await api.get('/posts', {
        params: { page, size, sort },
    });
    return response.data;
};

// Tek post getir
export const getPost = async (postId) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
};

// Post oluştur
export const createPost = async (data) => {
    const response = await api.post('/posts', data);
    return response.data;
};

// Post güncelle
export const updatePost = async (postId, data) => {
    const response = await api.put(`/posts/${postId}`, data);
    return response.data;
};

// Post sil
export const deletePost = async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
};
