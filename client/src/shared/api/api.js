import axios from 'axios';

export const isRequestCanceled = (error) => {
  return (
    axios.isCancel(error) ||
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||
    error?.name === 'AbortError'
  );
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong') => {
  if (isRequestCanceled(error)) {
    return '';
  }

  return (
    error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
  );
};

const api = axios.create({
  baseURL: import.meta.env.PROD ? 'http://localhost:5001' : '',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isRequestCanceled(error)) {
      error.isCanceled = true;
    }

    return Promise.reject(error);
  }
);

export default api;
