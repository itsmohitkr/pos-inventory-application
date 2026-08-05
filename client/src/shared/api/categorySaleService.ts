import type { AxiosRequestConfig } from 'axios';
import api, { isElectronProd } from '@/shared/api/api';
import { invokeIpc } from '@/shared/api/ipc';
import { IPC } from '@/shared/ipcChannels';
import type {
  CategorySale,
  CategorySaleInput,
  CategorySaleProductPreview,
} from '@/domains/promotions/types';

type RequestConfig = AxiosRequestConfig;

const categorySaleService = {
  fetchCategorySales: async (config: RequestConfig = {}): Promise<CategorySale[]> => {
    if (isElectronProd) {
      return invokeIpc(IPC.CATEGORY_SALE_GET_ALL);
    }
    const response = await api.get('/api/category-sales', config);
    return response.data;
  },

  createCategorySale: async (
    data: CategorySaleInput,
    config: RequestConfig = {}
  ): Promise<CategorySale> => {
    if (isElectronProd) {
      return invokeIpc(IPC.CATEGORY_SALE_CREATE, data);
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
      return invokeIpc(IPC.CATEGORY_SALE_UPDATE, { id, ...data });
    }
    const response = await api.put(`/api/category-sales/${id}`, data, config);
    return response.data;
  },

  toggleCategorySaleStatus: async (
    id: number,
    status: 'draft' | 'active' | 'paused',
    config: RequestConfig = {}
  ): Promise<CategorySale> => {
    if (isElectronProd) {
      return invokeIpc(IPC.CATEGORY_SALE_TOGGLE_STATUS, { id, status });
    }
    const response = await api.patch(`/api/category-sales/${id}/status`, { status }, config);
    return response.data;
  },

  deleteCategorySale: async (id: number, config: RequestConfig = {}): Promise<void> => {
    if (isElectronProd) {
      await invokeIpc(IPC.CATEGORY_SALE_DELETE, { id });
      return;
    }
    await api.delete(`/api/category-sales/${id}`, config);
  },

  previewProducts: async (
    category: string,
    discountPercentage: number,
    config: RequestConfig = {}
  ): Promise<CategorySaleProductPreview[]> => {
    if (isElectronProd) {
      return invokeIpc(IPC.CATEGORY_SALE_PREVIEW, { category, discountPercentage });
    }
    const response = await api.get('/api/category-sales/preview', {
      ...config,
      params: { category, discountPercentage },
    });
    return response.data;
  },
};

export default categorySaleService;
