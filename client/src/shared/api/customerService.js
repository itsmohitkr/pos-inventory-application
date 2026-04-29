import api from '@/shared/api/api';

const customerService = {
  findOrCreate: async (phone, name = null) => {
    const response = await api.post('/api/customers', { phone, name });
    return response.data;
  },

  findByPhone: async (phone) => {
    const response = await api.get(`/api/customers/phone/${encodeURIComponent(phone)}`);
    return response.data;
  },

  findByBarcode: async (barcode) => {
    const response = await api.get(`/api/customers/barcode/${encodeURIComponent(barcode)}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/customers/${id}`, data);
    return response.data;
  },

  getAll: async ({ page = 1, limit = 50, search = '' } = {}) => {
    const params = new URLSearchParams({ page, limit, search });
    const response = await api.get(`/api/customers?${params}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/customers/${id}`);
    return response.data;
  },

  getPurchaseHistory: async (id) => {
    const response = await api.get(`/api/customers/${id}/history`);
    return response.data;
  },

  sendBarcode: async ({ phone, barcode, shopName, customerName }) => {
    const response = await api.post('/api/whatsapp/send-barcode', { phone, barcode, shopName, customerName });
    return response.data;
  },
};

export default customerService;
