import type { AxiosRequestConfig } from 'axios';
import api, { isElectronProd } from '@/shared/api/api';
import { dualCall, invokeIpc } from '@/shared/api/ipc';
import { IPC } from '@/shared/ipcChannels';
import { getAdminToken } from '@/shared/api/adminToken';
import type {
  CategorySale,
  CategorySaleInput,
  CategorySaleProductPreview,
} from '@/domains/promotions/types';

type RequestConfig = AxiosRequestConfig;

const categorySaleService = {
  fetchCategorySales: (config: RequestConfig = {}): Promise<CategorySale[]> =>
    dualCall(isElectronProd, IPC.CATEGORY_SALE_GET_ALL, undefined, () =>
      api.get('/api/category-sales', config)
    ),

  createCategorySale: async (
    data: CategorySaleInput,
    config: RequestConfig = {}
  ): Promise<CategorySale> => {
    // A non-empty productOverrides is admin-gated (bypasses the automatic
    // margin floor) — the HTTP path already gets this via api.ts's request
    // interceptor attaching X-Admin-Token to every request; the IPC path
    // needs it added to the payload explicitly, same as settingsService.ts's
    // createUser/updateUser.
    if (isElectronProd) {
      const adminToken = data.productOverrides?.length ? getAdminToken() : undefined;
      return invokeIpc(IPC.CATEGORY_SALE_CREATE, { ...data, adminToken });
    }
    const response = await api.post('/api/category-sales', data, config);
    return response.data;
  },

  updateCategorySale: async (
    id: number,
    data: Partial<CategorySaleInput>,
    config: RequestConfig = {}
  ): Promise<CategorySale> => {
    if (isElectronProd) {
      const adminToken = data.productOverrides?.length ? getAdminToken() : undefined;
      return invokeIpc(IPC.CATEGORY_SALE_UPDATE, { id, ...data, adminToken });
    }
    const response = await api.put(`/api/category-sales/${id}`, data, config);
    return response.data;
  },

  toggleCategorySaleStatus: (
    id: number,
    status: 'draft' | 'active' | 'paused',
    config: RequestConfig = {}
  ): Promise<CategorySale> =>
    dualCall(isElectronProd, IPC.CATEGORY_SALE_TOGGLE_STATUS, { id, status }, () =>
      api.patch(`/api/category-sales/${id}/status`, { status }, config)
    ),

  deleteCategorySale: (id: number, config: RequestConfig = {}): Promise<void> =>
    dualCall(isElectronProd, IPC.CATEGORY_SALE_DELETE, { id }, () =>
      api.delete(`/api/category-sales/${id}`, config)
    ),

  previewProducts: (
    category: string,
    discountPercentage: number,
    config: RequestConfig = {}
  ): Promise<CategorySaleProductPreview[]> =>
    dualCall(isElectronProd, IPC.CATEGORY_SALE_PREVIEW, { category, discountPercentage }, () =>
      api.get('/api/category-sales/preview', {
        ...config,
        params: { category, discountPercentage },
      })
    ),
};

export default categorySaleService;
