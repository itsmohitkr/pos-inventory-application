import api from '@/shared/api/api';

const whatsappService = {
  getStatus: async () => {
    const response = await api.get('/api/whatsapp/status');
    return response.data;
  },

  getBrowserStatus: async () => {
    const response = await api.get('/api/whatsapp/browser-status');
    return response.data;
  },

  installBrowser: async () => {
    const response = await api.post('/api/whatsapp/install-browser');
    return response.data;
  },

  initialize: async () => {
    const response = await api.post('/api/whatsapp/initialize');
    return response.data;
  },

  destroy: async () => {
    const response = await api.post('/api/whatsapp/destroy');
    return response.data;
  },

  sendReceipt: async ({ phone, sale, shopName }) => {
    const response = await api.post('/api/whatsapp/send-receipt', { phone, sale, shopName });
    return response.data;
  },

  sendCapturedCard: async ({ phone, base64Image, caption }) => {
    const response = await api.post('/api/whatsapp/send-captured-card', { phone, base64Image, caption });
    return response.data;
  },
};

export default whatsappService;
