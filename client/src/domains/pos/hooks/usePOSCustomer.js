import { useState, useCallback, useRef } from 'react';
import customerService from '@/shared/api/customerService';

export const usePOSCustomer = ({ showNotification, shopName }) => {
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);

  const searchCustomers = useCallback((query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await customerService.getAll({ search: query, limit: 8 });
        setSearchResults(res.customers || res.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const lookupByPhone = useCallback(async (phone) => {
    if (!phone?.trim()) return null;
    setIsLoadingCustomer(true);
    try {
      const res = await customerService.findOrCreate(phone.trim());
      const { customer } = res;
      setActiveCustomer(customer);
      showNotification(`Customer: ${customer.name || customer.phone}`);
      return customer;
    } catch (err) {
      showNotification(err.response?.data?.error || 'Customer lookup failed', 'error');
      return null;
    } finally {
      setIsLoadingCustomer(false);
    }
  }, [showNotification]);

  const lookupByBarcode = useCallback(async (barcode) => {
    setIsLoadingCustomer(true);
    try {
      const res = await customerService.findByBarcode(barcode);
      setActiveCustomer(res);
      showNotification(`Customer: ${res.name || res.phone}`);
      return res;
    } catch {
      showNotification('Customer barcode not recognised', 'error');
      return null;
    } finally {
      setIsLoadingCustomer(false);
    }
  }, [showNotification]);

  const lookupCustomer = useCallback(async (query) => {
    if (query.startsWith('CUST-')) {
      return lookupByBarcode(query);
    }
    return lookupByPhone(query);
  }, [lookupByBarcode, lookupByPhone]);

  const selectCustomer = useCallback((customer) => {
    setActiveCustomer(customer);
    setSearchResults([]);
    showNotification(`Customer: ${customer.name || customer.phone}`);
  }, [showNotification]);

  const detachCustomer = useCallback(() => {
    setActiveCustomer(null);
    setSearchResults([]);
  }, []);

  const clearOnSale = useCallback(() => {
    setActiveCustomer(null);
    setSearchResults([]);
  }, []);

  const registerCustomer = useCallback(async (phone, name) => {
    if (!phone?.trim()) return null;
    setIsLoadingCustomer(true);
    try {
      const res = await customerService.findOrCreate(phone.trim(), name?.trim());
      const { customer } = res;
      setActiveCustomer(customer);
      showNotification(`Customer Saved: ${customer.name || customer.phone}`);
      return customer;
    } catch (err) {
      showNotification(err.response?.data?.error || 'Registration failed', 'error');
      return null;
    } finally {
      setIsLoadingCustomer(false);
    }
  }, [showNotification]);

  return {
    activeCustomer,
    isLoadingCustomer,
    searchResults,
    isSearching,
    searchCustomers,
    lookupCustomer,
    selectCustomer,
    detachCustomer,
    clearOnSale,
    registerCustomer,
  };
};
