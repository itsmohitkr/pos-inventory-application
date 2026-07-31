import type { AxiosRequestConfig } from 'axios';
import api from '@/shared/api/api';
import type {
  CategorySale,
  CategorySaleInput,
  CategorySaleProductPreview,
} from '@/domains/promotions/types';

type RequestConfig = AxiosRequestConfig;

const categorySaleService = {
  fetchCategorySales: async (config: RequestConfig = {}): Promise<CategorySale[]> => {
    const response = await api.get('/api/category-sales', config);
    return response.data;
  },

  createCategorySale: async (
    data: CategorySaleInput,
    config: RequestConfig = {}
  ): Promise<CategorySale> => {
    const response = await api.post('/api/category-sales', data, config);
    return response.data;
  },

  updateCategorySale: async (
    id: number,
    data: Partial<CategorySaleInput>,
    config: RequestConfig = {}
  ): Promise<CategorySale> => {
    const response = await api.put(`/api/category-sales/${id}`, data, config);
    return response.data;
  },

  toggleCategorySaleStatus: async (
    id: number,
    status: 'draft' | 'active' | 'paused',
    config: RequestConfig = {}
  ): Promise<CategorySale> => {
    const response = await api.patch(`/api/category-sales/${id}/status`, { status }, config);
    return response.data;
  },

  deleteCategorySale: async (id: number, config: RequestConfig = {}): Promise<void> => {
    await api.delete(`/api/category-sales/${id}`, config);
  },

  previewProducts: async (
    category: string,
    discountPercentage: number,
    config: RequestConfig = {}
  ): Promise<CategorySaleProductPreview[]> => {
    const response = await api.get('/api/category-sales/preview', {
      ...config,
      params: { category, discountPercentage },
    });
    return response.data;
  },
};

export default categorySaleService;
