import api, { isElectronProd } from '@/shared/api/api';
import { dualCall } from '@/shared/api/ipc';
import { IPC } from '@/shared/ipcChannels';
import type { PaymentStatus, Purchase } from '@/domains/expenses/components/expenseTypes';

/** A vendor record as returned by the API. */
export interface Vendor {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A vendor with its purchase totals attached, as returned by the list/detail endpoints. */
export interface VendorWithTotals extends Vendor {
  totalPurchased: number;
  totalDue: number;
  purchaseCount: number;
  lastPurchaseDate: string | null;
}

/** findOrCreate reports whether it created the record. */
export interface FindOrCreateVendorResult {
  vendor: Vendor;
  isNew: boolean;
}

export interface VendorListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface VendorListResult {
  vendors: VendorWithTotals[];
  total: number;
  page: number;
  limit: number;
}

export interface VendorDetail {
  vendor: Vendor;
  purchases: (Purchase & { paymentStatus: PaymentStatus })[];
  totalPurchased: number;
  totalDue: number;
  purchaseCount: number;
  lastPurchaseDate: string | null;
}

export interface UpdateVendorInput {
  name?: string;
  phone?: string | null;
  address?: string | null;
}

const vendorService = {
  findOrCreate: (name: string, phone?: string | null, address?: string | null): Promise<FindOrCreateVendorResult> =>
    dualCall(isElectronProd, IPC.VENDOR_FIND_OR_CREATE, { name, phone, address }, () =>
      api.post('/api/vendors', { name, phone, address })
    ),

  getAll: ({ page = 1, limit = 50, search = '' }: VendorListParams = {}): Promise<VendorListResult> =>
    dualCall(isElectronProd, IPC.VENDOR_GET_ALL, { page, limit, search }, () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
      return api.get(`/api/vendors?${params}`);
    }),

  getById: (id: number): Promise<VendorDetail> =>
    dualCall(isElectronProd, IPC.VENDOR_GET_BY_ID, { id }, () => api.get(`/api/vendors/${id}`)),

  update: (id: number, data: UpdateVendorInput): Promise<Vendor> =>
    dualCall(isElectronProd, IPC.VENDOR_UPDATE, { id, ...data }, () => api.put(`/api/vendors/${id}`, data)),
};

export default vendorService;
