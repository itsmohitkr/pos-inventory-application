export const SAMPLE_SALE = {
  id: 'PREVIEW',
  date: new Date().toLocaleDateString('en-GB'),
  total: 200,
  tax: 0,
  subtotal: 200,
  paymentMethod: 'CASH',
  customer: { name: 'Walk-in Customer', phone: '9876543210' },
  items: [
    {
      quantity: 2,
      sellingPrice: 40,
      batch: {
        mrp: 50,
        expiryDate: null as string | null,
        product: { name: 'Sample Tea 200g', barcode: '8900000000011' },
      },
    },
    {
      quantity: 1,
      sellingPrice: 120,
      batch: {
        mrp: 140,
        expiryDate: null,
        product: { name: 'Sample Milk 1L', barcode: '8900000000012' },
      },
    },
  ],
};
