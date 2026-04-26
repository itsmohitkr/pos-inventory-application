import { useState, useCallback } from 'react';
import customerService from '@/shared/api/customerService';

export const usePOSCustomer = ({ whatsappEnabled, showNotification, shopName }) => {
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

  const lookupByPhone = useCallback(async (phone) => {
    if (!phone?.trim()) return null;
    setIsLoadingCustomer(true);
    try {
      const res = await customerService.findOrCreate(phone.trim());
      const { customer, isNew } = res;
      setActiveCustomer(customer);

      if (isNew && whatsappEnabled) {
        try {
          await customerService.sendBarcode({
            phone: customer.phone,
            barcode: customer.customerBarcode,
            shopName,
            customerName: customer.name,
          });
          showNotification(`New customer registered. Barcode sent via WhatsApp ✓`);
        } catch {
          showNotification(`Customer registered. WhatsApp send failed — barcode: ${customer.customerBarcode}`, 'warning');
        }
      } else {
        showNotification(`Customer: ${customer.name || customer.phone}`);
      }
      return customer;
    } catch (err) {
      showNotification(err.response?.data?.error || 'Customer lookup failed', 'error');
      return null;
    } finally {
      setIsLoadingCustomer(false);
    }
  }, [whatsappEnabled, showNotification, shopName]);

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

  const detachCustomer = useCallback(() => setActiveCustomer(null), []);

  const clearOnSale = useCallback(() => setActiveCustomer(null), []);

  return {
    activeCustomer,
    isLoadingCustomer,
    lookupCustomer,
    detachCustomer,
    clearOnSale,
  };
};
