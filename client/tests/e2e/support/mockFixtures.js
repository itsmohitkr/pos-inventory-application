export const adminUserFixture = {
  id: 1,
  username: 'admin',
  role: 'admin',
  status: 'active',
};

export const inventoryProductsFixture = [
  {
    id: 101,
    name: 'Masala Tea 250g',
    barcode: '8900000000101',
    category: 'Beverages',
    costPrice: 78,
    sellingPrice: 95,
    totalQuantity: 24,
    batches: [
      {
        id: 1001,
        batchNumber: 'B-001',
        quantity: 24,
        costPrice: 78,
        sellingPrice: 95,
        mrp: 110,
        expiryDate: null,
      },
    ],
  },
];

export const periodicReportFixture = {
  sales: [],
  looseSales: [],
  expenses: [],
  purchases: [],
  totalSales: 0,
  totalExpenses: 0,
  totalPurchases: 0,
  totalProfit: 0,
};

export const monthlyReportFixture = Array.from({ length: 12 }, (_, index) => ({
  month: index + 1,
  totalSales: index === 0 ? 2500 : 0,
}));

export const dailyReportFixture = [
  { day: 1, totalSales: 1200 },
  { day: 2, totalSales: 850 },
  { day: 3, totalSales: 0 },
  { day: 4, totalSales: 600 },
  { day: 5, totalSales: 400 },
];

export const promotionsFixture = [
  {
    id: 201,
    name: 'Weekend Tea Offer',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-04-30T23:59:59.999Z',
    isActive: true,
    items: [
      {
        productId: 101,
        promoPrice: 89,
        product: { id: 101, name: 'Masala Tea 250g' },
      },
    ],
  },
];

export const purchasesFixture = [
  {
    id: 301,
    vendor: 'Fresh Wholesale',
    totalAmount: 1250,
    totalPaid: 1250,
    dueAmount: 0,
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    note: 'Restock pantry goods',
    date: '2026-04-10T09:00:00.000Z',
    items: [],
    payments: [],
  },
];

export const expensesFixture = [
  {
    id: 401,
    amount: 450,
    category: 'Electricity',
    description: 'April utility bill',
    date: '2026-04-10T09:00:00.000Z',
    paymentMethod: 'Cash',
    dueAmount: 0,
    paymentStatus: 'Paid',
    payments: [],
  },
];

export const salesFixture = [
  {
    id: 11,
    createdAt: '2026-04-10T10:15:00.000Z',
    totalAmount: 190,
    netTotalAmount: 190,
    discount: 0,
    extraDiscount: 0,
    paymentMethod: 'Cash',
    items: [
      {
        id: 111,
        batchId: 1001,
        quantity: 2,
        returnedQuantity: 0,
        productName: 'Masala Tea 250g',
        sellingPrice: 95,
        mrp: 110,
        batch: {
          id: 1001,
          batchCode: 'B-001',
          product: { id: 101, name: 'Masala Tea 250g' },
        },
      },
    ],
  },
];

export const looseSalesFixture = [
  {
    id: 21,
    itemName: 'Loose Rice',
    price: 65,
    createdAt: '2026-04-10T12:00:00.000Z',
  },
];

export const settingsFixture = {
  data: {
    posShopName: 'Bachat Bazaar',
    posReceiptSettings: {
      customShopName: 'Bachat Bazaar',
      directPrint: false,
    },
    promotion_buy_x_get_free: {
      enabled: false,
      config: [],
    },
    posPaymentSettings: {
      enabledMethods: ['cash'],
      customMethods: [],
      allowMultplePayment: false,
    },
    posEnableExtraDiscount: true,
    posNotificationDuration: 3000,
    posEnableWeightedAverageCost: false,
    shopMobile: '',
    shopMobile2: '',
    shopAddress: '',
    shopEmail: '',
    shopGST: '',
    shopLogo: '',
  },
};