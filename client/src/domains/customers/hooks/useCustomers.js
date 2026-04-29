import { useState, useCallback, useEffect } from 'react';
import customerService from '@/shared/api/customerService';

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const [editingCustomer, setEditingCustomer] = useState(null);

  const LIMIT = 50;

  const fetchCustomers = useCallback(async (pageNum = 1, searchTerm = '') => {
    setIsLoading(true);
    try {
      const res = await customerService.getAll({ page: pageNum, limit: LIMIT, search: searchTerm });
      setCustomers(res?.customers || []);
      setTotal(res?.total || 0);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(page, search);
  }, [fetchCustomers, page, search]);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openHistory = useCallback(async (customer) => {
    setSelectedCustomer(customer);
    setHistoryData(null);
    setIsLoadingHistory(true);
    try {
      const res = await customerService.getPurchaseHistory(customer.id);
      setHistoryData(res);
    } catch (err) {
      console.error('Failed to fetch purchase history', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const closeHistory = useCallback(() => {
    setSelectedCustomer(null);
    setHistoryData(null);
  }, []);

  const openEdit = useCallback((customer) => {
    setEditingCustomer(customer);
  }, []);

  const closeEdit = useCallback(() => {
    setEditingCustomer(null);
  }, []);

  const handleSaveEdit = useCallback(async (id, data) => {
    await customerService.update(id, data);
    fetchCustomers(page, search);
  }, [fetchCustomers, page, search]);

  return {
    customers,
    total,
    page,
    search,
    isLoading,
    selectedCustomer,
    historyData,
    isLoadingHistory,
    editingCustomer,
    LIMIT,
    setPage,
    handleSearchChange,
    openHistory,
    closeHistory,
    openEdit,
    closeEdit,
    handleSaveEdit,
    fetchCustomers,
  };
};
