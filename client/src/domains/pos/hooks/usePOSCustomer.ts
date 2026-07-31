import { useState, useCallback, useRef } from 'react';
import * as Sentry from '@sentry/react';
import customerService from '@/shared/api/customerService';
import type { Customer } from '@/shared/api/customerService';

interface UsePOSCustomerArgs {
  showNotification: (message: string, severity?: string) => void;
  /** Printed on the customer card; unused by the lookups themselves. */
  shopName?: string;
}

export const usePOSCustomer = ({ showNotification }: UsePOSCustomerArgs) => {
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchCustomers = useCallback((query: string) => {
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

  const lookupByPhone = useCallback(async (phone: string) => {
    if (!phone?.trim()) return null;
    setIsLoadingCustomer(true);
    try {
      const res = await customerService.findOrCreate(phone.trim());
      const customer = res.customer ?? null;
      setActiveCustomer(customer);
      if (customer) showNotification(`Customer: ${customer.name || customer.phone}`);
      return customer;
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'pos-customer-lookup' } });
      showNotification(err.response?.data?.error || 'Customer lookup failed', 'error');
      return null;
    } finally {
      setIsLoadingCustomer(false);
    }
  }, [showNotification]);

  // NOTE: unlike lookupByPhone this has no empty-input guard, and its bare
  // catch treats every failure as "not recognised" — a network error or a 500
  // shows the same message as an unknown card. Left as-is; changing it is a
  // behaviour change, not a typing one.
  const lookupByBarcode = useCallback(async (barcode: string) => {
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

  const lookupCustomer = useCallback(async (query: string) => {
    if (query.startsWith('CUST-')) {
      return lookupByBarcode(query);
    }
    return lookupByPhone(query);
  }, [lookupByBarcode, lookupByPhone]);

  const selectCustomer = useCallback((customer: Customer | null) => {
    setActiveCustomer(customer);
    setSearchResults([]);
    if (customer) showNotification(`Customer: ${customer.name || customer.phone}`);
  }, [showNotification]);

  const detachCustomer = useCallback(() => {
    setActiveCustomer(null);
    setSearchResults([]);
  }, []);

  const clearOnSale = useCallback(() => {
    setActiveCustomer(null);
    setSearchResults([]);
  }, []);

  const registerCustomer = useCallback(async (phone: string, name?: string) => {
    if (!phone?.trim()) return null;
    setIsLoadingCustomer(true);
    try {
      const res = await customerService.findOrCreate(phone.trim(), name?.trim());
      const customer = res.customer ?? null;
      setActiveCustomer(customer);
      if (customer) showNotification(`Customer Saved: ${customer.name || customer.phone}`);
      return customer;
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'pos-customer-register' } });
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
