import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    getMe: () => api.get('/auth/me'),
};

export const voterAPI = {
    register: (data) => api.post('/voters/register', data),
    getAll: () => api.get('/voters'),
    update: (id, data) => api.put(`/voters/${id}`, data),
    delete: (id) => api.delete(`/voters/${id}`)
};

export const votingAPI = {
    authenticateFace: (data) => api.post('/voting/authenticate/face', data),
    authenticateFingerprint: (data) => api.post('/voting/authenticate/fingerprint', data),
    castVote: (data) => api.post('/voting/cast-vote', data),
};

export const electionAPI = {
    getAll: () => api.get('/elections'),
    create: (data) => api.post('/elections', data),
    update: (id, data) => api.put(`/elections/${id}`, data),
    delete: (id) => api.delete(`/elections/${id}`),
    start: (id) => api.put(`/elections/${id}/start`),
    close: (id) => api.put(`/elections/${id}/close`),
    getResults: (id) => api.get(`/elections/${id}/results`),
    getConstituencies: (id) => api.get(`/elections/${id}/constituencies`),
    createConstituency: (data) => api.post('/elections/constituencies', data),
};

export const candidateAPI = {
    getByConstituency: (id) => api.get(`/candidates/constituency/${id}`),
    getByElection: (id) => api.get(`/candidates/election/${id}`),
    create: (data) => api.post('/candidates', data),
};

export default api;
