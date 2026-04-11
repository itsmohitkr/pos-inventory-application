import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.PROD ? 'http://localhost:5001' : '',
    timeout: 10000,
});

export default api;
