import api, { isElectronProd } from '@/shared/api/api';
import { dualCall } from '@/shared/api/ipc';
import { IPC } from '@/shared/ipcChannels';
import type { Sale } from '@/shared/types/models';

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
  /**
   * Sale count, present only on the list endpoint — getAll includes
   * `_count: { select: { sales: true } }`. Absent on the single-customer
   * reads, hence optional.
   */
  _count?: { sales: number };
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

/**
 * GET /api/customers/:id/history — the customer plus their sales, each with
 * items and the batch's product projection.
 */
export interface CustomerPurchaseHistory {
  customer: Customer;
  sales: Sale[];
}

export interface CustomerListResult {
  customers?: Customer[];
  data?: Customer[];
  total?: number;
  [key: string]: unknown;
}

const customerService = {
  findOrCreate: (phone: string, name: string | null = null): Promise<FindOrCreateResult> =>
    dualCall(isElectronProd, IPC.CUSTOMER_FIND_OR_CREATE, { phone, name }, () =>
      api.post('/api/customers', { phone, name })
    ),

  findByPhone: (phone: string): Promise<Customer> =>
    dualCall(isElectronProd, IPC.CUSTOMER_GET_BY_PHONE, { phone }, () =>
      api.get(`/api/customers/phone/${encodeURIComponent(phone)}`)
    ),

  findByBarcode: (barcode: string): Promise<Customer> =>
    dualCall(isElectronProd, IPC.CUSTOMER_GET_BY_BARCODE, { barcode }, () =>
      api.get(`/api/customers/barcode/${encodeURIComponent(barcode)}`)
    ),

  update: (id: number, data: Partial<Customer>): Promise<Customer> =>
    dualCall(isElectronProd, IPC.CUSTOMER_UPDATE, { id, ...data }, () =>
      api.put(`/api/customers/${id}`, data)
    ),

  getAll: ({
    page = 1,
    limit = 50,
    search = '',
    sortBy = 'createdAt',
    order = 'desc',
  }: CustomerListParams = {}): Promise<CustomerListResult> =>
    dualCall(isElectronProd, IPC.CUSTOMER_GET_ALL, { page, limit, search, sortBy, order }, () => {
      // URLSearchParams coerced these numbers to strings implicitly before;
      // String() makes that explicit without changing the emitted query.
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        order,
      });
      return api.get(`/api/customers?${params}`);
    }),

  getById: (id: number): Promise<Customer> =>
    dualCall(isElectronProd, IPC.CUSTOMER_GET_BY_ID, { id }, () => api.get(`/api/customers/${id}`)),

  getPurchaseHistory: (id: number): Promise<CustomerPurchaseHistory> =>
    dualCall(isElectronProd, IPC.CUSTOMER_GET_PURCHASE_HISTORY, { id }, () =>
      api.get(`/api/customers/${id}/history`)
    ),
};

export default customerService;
