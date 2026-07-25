import api from '@/shared/api/api';

/** A customer record as returned by the API. */
export interface Customer {
  id: number;
  phone: string;
  name: string | null;
  customerBarcode: string;
  totalSpend: number;
  lastVisit: string | null;
  createdAt: string;
  updatedAt: string;
}

/** findOrCreate reports whether it created the record. */
export interface FindOrCreateResult {
  customer?: Customer;
  isNew: boolean;
  [key: string]: unknown;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface CustomerListResult {
  customers?: Customer[];
  data?: Customer[];
  total?: number;
  [key: string]: unknown;
}

const customerService = {
  findOrCreate: async (phone: string, name: string | null = null): Promise<FindOrCreateResult> => {
    const response = await api.post('/api/customers', { phone, name });
    return response.data;
  },

  findByPhone: async (phone: string): Promise<Customer> => {
    const response = await api.get(`/api/customers/phone/${encodeURIComponent(phone)}`);
    return response.data;
  },

  findByBarcode: async (barcode: string): Promise<Customer> => {
    const response = await api.get(`/api/customers/barcode/${encodeURIComponent(barcode)}`);
    return response.data;
  },

  update: async (id: number, data: Partial<Customer>): Promise<Customer> => {
    const response = await api.put(`/api/customers/${id}`, data);
    return response.data;
  },

  getAll: async ({
    page = 1,
    limit = 50,
    search = '',
    sortBy = 'createdAt',
    order = 'desc',
  }: CustomerListParams = {}): Promise<CustomerListResult> => {
    // URLSearchParams coerced these numbers to strings implicitly before;
    // String() makes that explicit without changing the emitted query.
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search,
      sortBy,
      order,
    });
    const response = await api.get(`/api/customers?${params}`);
    return response.data;
  },

  getById: async (id: number): Promise<Customer> => {
    const response = await api.get(`/api/customers/${id}`);
    return response.data;
  },

  getPurchaseHistory: async (id: number): Promise<unknown> => {
    const response = await api.get(`/api/customers/${id}/history`);
    return response.data;
  },
};

export default customerService;
