import api from './axiosConfig';

export const getLeaderboard = async (limit = 20) => {
    const response = await api.get('/gamification/leaderboard', {
        params: { limit }
    });
    return response.data;
};
