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

// --- Beğeni (Like) Endpoints ---
export const toggleLike = async (postId) => {
    const response = await api.post(`/posts/${postId}/likes`);
    return response.data;
};

export const getLikeCount = async (postId) => {
    const response = await api.get(`/posts/${postId}/likes/count`);
    return response.data;
};

export const getLikeStatus = async (postId) => {
    const response = await api.get(`/posts/${postId}/likes/status`);
    return response.data;
};

// --- Yorum (Comment) Endpoints ---
export const addComment = async (postId, content) => {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
};

export const getComments = async (postId) => {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
};

export const updateComment = async (commentId, content) => {
    const response = await api.put(`/posts/comments/${commentId}`, { content });
    return response.data;
};

export const deleteComment = async (commentId) => {
    const response = await api.delete(`/posts/comments/${commentId}`);
    return response.data;
};

// --- Yanıt (Reply) Endpoints ---
export const addReply = async (commentId, content) => {
    const response = await api.post(`/posts/comments/${commentId}/replies`, { content });
    return response.data;
};

export const getReplies = async (commentId) => {
    const response = await api.get(`/posts/comments/${commentId}/replies`);
    return response.data;
};

// --- Kaydetme (Bookmark) Endpoints ---
export const toggleSave = async (postId) => {
    const response = await api.post(`/posts/${postId}/bookmark`);
    return response.data;
};

export const getSavedPosts = async (page = 0, size = 10, sort = 'createdAt,desc') => {
    const response = await api.get(`/posts/saved`, { params: { page, size, sort } });
    return response.data;
};

export const getSaveStatus = async (postId) => {
    const response = await api.get(`/posts/${postId}/save/status`);
    return response.data;
};
