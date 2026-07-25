export const PAYMENT_METHOD_CONFIG = {
  cash: { label: 'Cash', color: '#16a34a' },
  upi: { label: 'UPI', color: '#0369a1' },
  card: { label: 'Card', color: '#7c3aed' },
  wallet: { label: 'Digital Wallet', color: '#ea580c' },
  bank_transfer: { label: 'Bank Transfer', color: '#0891b2' },
  cheque: { label: 'Cheque', color: '#64748b' },
};

export const getAvailablePaymentMethods = (paymentSettings) => {
  const enabled = paymentSettings?.enabledMethods || [];
  const custom = paymentSettings?.customMethods || [];

  const methods = Object.entries(PAYMENT_METHOD_CONFIG)
    .filter(([id]) => enabled.includes(id))
    .map(([id, config]) => ({ id, ...config }));

  custom.forEach((m) => {
    methods.push({
      id: m.id,
      label: m.label,
      color: '#64748b',
    });
  });

  return methods;
};
