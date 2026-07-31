import {
  dailyReportFixture,
  expensesFixture,
  inventoryProductsFixture,
  looseSalesFixture,
  monthlyReportFixture,
  periodicReportFixture,
  promotionsFixture,
  purchasesFixture,
  salesFixture,
  settingsFixture,
  customersFixture,
} from './mockFixtures';


const clone = (value) => JSON.parse(JSON.stringify(value));

const buildSummary = (products) => {
  const totals = products.reduce(
    (accumulator, product) => {
      const productQuantity = Number(product.totalQuantity || 0);
      const productCost = Number(product.costPrice || 0);
      const productSelling = Number(product.sellingPrice || 0);
      const productMrp = Number(product.batches?.[0]?.mrp || 0);

      return {
        productCount: accumulator.productCount + 1,
        totalQty: accumulator.totalQty + productQuantity,
        totalCost: accumulator.totalCost + productQuantity * productCost,
        totalSelling: accumulator.totalSelling + productQuantity * productSelling,
        totalMrp: accumulator.totalMrp + productQuantity * productMrp,
      };
    },
    {
      productCount: 0,
      totalQty: 0,
      totalCost: 0,
      totalSelling: 0,
      totalMrp: 0,
    }
  );

  const categoryCounts = products.reduce((accumulator, product) => {
    const category = product.category || 'Uncategorized';
    accumulator[category] = (accumulator[category] || 0) + 1;
    return accumulator;
  }, {});

  return {
    totals,
    categoryCounts,
    uncategorizedCount: categoryCounts.Uncategorized || 0,
    totalCount: products.length,
  };
};

const buildCategoryTree = (products) => {
  const uniqueCategories = [
    ...new Set(products.map((product) => product.category).filter(Boolean)),
  ];

  return uniqueCategories.map((category) => ({
    id: category.toLowerCase().replace(/\s+/g, '-'),
    name: category,
    path: category,
    children: [],
  }));
};

const toNumeric = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ensureUiShape = (product) => ({
  ...product,
  totalQuantity: toNumeric(product.totalQuantity, toNumeric(product.total_stock, 0)),
  total_stock: toNumeric(product.total_stock, toNumeric(product.totalQuantity, 0)),
  batches: (product.batches || []).map((batch) => ({
    ...batch,
    batchNumber: batch.batchNumber || batch.batchCode || null,
    batchCode: batch.batchCode || batch.batchNumber || null,
    quantity: toNumeric(batch.quantity, 0),
    costPrice: toNumeric(batch.costPrice, 0),
    sellingPrice: toNumeric(batch.sellingPrice, 0),
    mrp: toNumeric(batch.mrp, 0),
  })),
});

const recalculateProductTotals = (product) => {
  const totalStock = (product.batches || []).reduce(
    (sum, batch) => sum + toNumeric(batch.quantity, 0),
    0
  );
  product.totalQuantity = totalStock;
  product.total_stock = totalStock;
};

export const createMockState = () => {
  const state = {
    products: clone(inventoryProductsFixture).map(ensureUiShape),
    promotions: clone(promotionsFixture),
    expenses: clone(expensesFixture),
    purchases: clone(purchasesFixture),
    looseSales: clone(looseSalesFixture),
    settings: clone(settingsFixture.data),
    periodicReport: clone(periodicReportFixture),
    monthlyReport: clone(monthlyReportFixture),
    dailyReport: clone(dailyReportFixture),
    sales: clone(salesFixture),
    customers: clone(customersFixture),
    users: [
      { id: 1, username: 'admin', role: 'admin', status: 'active', password: 'password123' },
      { id: 2, username: 'salesman', role: 'salesman', status: 'active', password: 'password123' },
    ],
    nextSaleId: Math.max(0, ...salesFixture.map((sale) => Number(sale.id) || 0)) + 1,
    nextCustomerId: Math.max(0, ...customersFixture.map((c) => Number(c.id) || 0)) + 1,
    nextSaleItemId:
      Math.max(
        0,
        ...salesFixture.flatMap((sale) => (sale.items || []).map((item) => Number(item.id) || 0))
      ) + 1,
    nextLooseSaleId: Math.max(0, ...looseSalesFixture.map((sale) => Number(sale.id) || 0)) + 1,
  };

  // Initialize isDeleted flag
  state.products.forEach((p) => {
    p.isDeleted = false;
  });

  const findProductAndBatchByBatchId = (batchId) => {
    for (const product of state.products) {
      const batch = (product.batches || []).find(
        (candidate) => String(candidate.id) === String(batchId)
      );
      if (batch) {
        return { product, batch };
      }
    }
    return null;
  };

  const getProductByIdInternal = (productId) =>
    state.products.find(
      (item) => String(item.id) === String(productId) && item.isDeleted === false
    ) || null;

  const getProductByBarcodeInternal = (barcode) =>
    state.products.find(
      (item) =>
        item.isDeleted === false && item.barcode?.split('|').some((entry) => entry === barcode)
    ) || null;

  return {
    getProducts: () => state.products.filter((p) => !p.isDeleted),
    getProductSummary: () => buildSummary(state.products.filter((p) => !p.isDeleted)),
    getCategoryTree: () => buildCategoryTree(state.products.filter((p) => !p.isDeleted)),
    getProductById: (productId) => getProductByIdInternal(productId),
    getProductByBarcode: (barcode) => getProductByBarcodeInternal(barcode),
    createProduct: (payload) => {
      const nextId = Math.max(0, ...state.products.map((product) => Number(product.id) || 0)) + 1;
      const quantity = Number(payload.initialBatch?.quantity || 0);
      const mrp = Number(payload.initialBatch?.mrp || 0);
      const costPrice = Number(payload.initialBatch?.cost_price || 0);
      const sellingPrice = Number(payload.initialBatch?.selling_price || 0);
      const newProduct = {
        id: nextId,
        name: payload.name,
        barcode: payload.barcode,
        category: payload.category || 'Uncategorized',
        costPrice,
        sellingPrice,
        totalQuantity: quantity,
        total_stock: quantity,
        batches: [
          {
            id: nextId * 10,
            batchNumber: payload.initialBatch?.batch_code || `B-${nextId}`,
            batchCode: payload.initialBatch?.batch_code || `B-${nextId}`,
            quantity,
            costPrice,
            sellingPrice,
            mrp,
            expiryDate: payload.initialBatch?.expiryDate || null,
          },
        ],
        lowStockThreshold: Number(payload.lowStockThreshold || 2),
        lowStockWarningEnabled: payload.lowStockWarningEnabled ?? true,
        isDeleted: false,
      };

      state.products.push(newProduct);
      return newProduct;
    },
    updateProduct: (id, payload) => {
      const product = getProductByIdInternal(id);
      if (!product) return null;

      product.name = payload.name ?? product.name;
      product.category = payload.category ?? product.category;
      product.barcode = payload.barcode ?? product.barcode;
      product.batchTrackingEnabled = payload.batchTrackingEnabled ?? product.batchTrackingEnabled;
      product.lowStockWarningEnabled =
        payload.lowStockWarningEnabled ?? product.lowStockWarningEnabled;
      product.lowStockThreshold = payload.lowStockThreshold ?? product.lowStockThreshold;
      return product;
    },
    deleteProduct: (id) => {
      const product = state.products.find((p) => String(p.id) === String(id));
      if (!product) return false;
      product.isDeleted = true;
      product.deletedAt = new Date().toISOString();
      return true;
    },
    updateBatch: (id, payload) => {
      const match = findProductAndBatchByBatchId(id);
      if (!match) return null;

      const { product, batch } = match;
      batch.quantity = toNumeric(payload.quantity, batch.quantity);
      batch.costPrice = toNumeric(payload.costPrice, batch.costPrice);
      batch.sellingPrice = toNumeric(payload.sellingPrice, batch.sellingPrice);
      batch.mrp = payload.mrp !== undefined ? toNumeric(payload.mrp, batch.mrp) : batch.mrp;
      recalculateProductTotals(product);
      return batch;
    },
    processSale: (payload) => {
      const rawItems = payload.items || [];
      const saleItems = rawItems
        .map((item) => {
          const match = findProductAndBatchByBatchId(item.batch_id);
          const quantity = toNumeric(item.quantity, 0);
          const sellingPrice = toNumeric(item.sellingPrice, 0);

          if (!match || quantity <= 0) {
            return null;
          }

          const { product, batch } = match;
          batch.quantity = Math.max(0, toNumeric(batch.quantity, 0) - quantity);
          recalculateProductTotals(product);

          return {
            id: state.nextSaleItemId++,
            batchId: batch.id,
            quantity,
            returnedQuantity: 0,
            sellingPrice,
            isFree: Boolean(item.isFree),
            productName: product.name,
            batch: {
              id: batch.id,
              batchCode: batch.batchCode || batch.batchNumber || null,
              product: {
                id: product.id,
                name: product.name,
              },
            },
          };
        })
        .filter(Boolean);

      const saleId = state.nextSaleId++;
      const totalAmount = saleItems.reduce(
        (sum, item) => sum + toNumeric(item.sellingPrice, 0) * toNumeric(item.quantity, 0),
        0
      );

      const sale = {
        id: saleId,
        createdAt: new Date().toISOString(),
        totalAmount,
        netTotalAmount: totalAmount,
        discount: toNumeric(payload.extraDiscount, 0),
        extraDiscount: toNumeric(payload.extraDiscount, 0),
        paymentMethod: payload.paymentMethod || 'Cash',
        customerId: payload.customerId || null,
        items: saleItems,
      };

      state.sales.push(sale);

      if (payload.customerId) {
        const customer = state.customers.find(c => String(c.id) === String(payload.customerId));
        if (customer) {
          customer.totalSpend = toNumeric(customer.totalSpend, 0) + totalAmount;
          customer.lastVisit = sale.createdAt;
        }
      }

      return { saleId, sale };
    },

    getSaleById: (saleId) => state.sales.find((sale) => String(sale.id) === String(saleId)) || null,
    processRefund: (saleId, items) => {
      const sale = state.sales.find((entry) => String(entry.id) === String(saleId));
      if (!sale) return null;

      for (const returnedItem of items || []) {
        const saleItem = sale.items.find(
          (entry) => String(entry.id) === String(returnedItem.saleItemId)
        );
        if (!saleItem) {
          continue;
        }
        const quantityToReturn = toNumeric(returnedItem.quantity, 0);
        const remaining = toNumeric(saleItem.quantity, 0) - toNumeric(saleItem.returnedQuantity, 0);
        const acceptedReturnQty = Math.max(0, Math.min(quantityToReturn, remaining));
        if (acceptedReturnQty === 0) {
          continue;
        }

        saleItem.returnedQuantity = toNumeric(saleItem.returnedQuantity, 0) + acceptedReturnQty;

        const match = findProductAndBatchByBatchId(saleItem.batchId);
        if (match) {
          match.batch.quantity = toNumeric(match.batch.quantity, 0) + acceptedReturnQty;
          recalculateProductTotals(match.product);
        }

        if (sale.customerId) {
          const customer = state.customers.find(c => String(c.id) === String(sale.customerId));
          if (customer) {
            customer.totalSpend = Math.max(0, toNumeric(customer.totalSpend, 0) - (acceptedReturnQty * saleItem.sellingPrice));
          }
        }
      }

      return { success: true, sale };
    },
    getCustomers: () => state.customers,
    getCustomerById: (id) => state.customers.find(c => String(c.id) === String(id)) || null,
    getCustomerHistory: (id) => {
      const customer = state.customers.find(c => String(c.id) === String(id));
      if (!customer) return null;
      return {
        customer,
        sales: state.sales.filter(s => String(s.customerId) === String(id))
      };
    },
    updateCustomer: (id, payload) => {
      const customer = state.customers.find(c => String(c.id) === String(id));
      if (!customer) return null;
      customer.name = payload.name ?? customer.name;
      customer.phone = payload.phone ?? customer.phone;
      return customer;
    },

    getPromotions: () => state.promotions,
    updatePromotion: (id, payload) => {
      const promotion = state.promotions.find((item) => String(item.id) === String(id));
      if (!promotion) return null;
      Object.assign(promotion, payload);
      return promotion;
    },
    deletePromotion: (id) => {
      const before = state.promotions.length;
      state.promotions = state.promotions.filter(
        (promotion) => String(promotion.id) !== String(id)
      );
      return before !== state.promotions.length;
    },
    createPromotion: (payload) => {
      const nextId =
        Math.max(0, ...state.promotions.map((promotion) => Number(promotion.id) || 0)) + 1;
      const newPromotion = {
        id: nextId,
        ...payload,
        isActive: true,
        items: payload.items || [],
      };

      state.promotions.push(newPromotion);
      return newPromotion;
    },
    getSettings: () => ({ data: state.settings }),
    updateSettings: (payload) => {
      if (payload?.settings) {
        Object.entries(payload.settings).forEach(([key, value]) => {
          state.settings[key] = value;
        });
      } else if (payload?.key) {
        state.settings[payload.key] = payload.value;
      }
      return { success: true, data: state.settings };
    },
    getExpenses: () => state.expenses,
    createExpense: (payload) => {
      const nextId = Math.max(0, ...state.expenses.map((expense) => Number(expense.id) || 0)) + 1;
      const amount = toNumeric(payload.amount, 0);
      const paidAmount = toNumeric(payload.paidAmount, 0);
      const dueAmount = Math.max(0, amount - paidAmount);
      const expense = {
        id: nextId,
        amount,
        category: payload.category || 'Misc',
        description: payload.description || '',
        date: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
        paymentMethod: payload.paymentMethod || 'Cash',
        dueAmount,
        paymentStatus: dueAmount > 0 ? 'Due' : 'Paid',
        payments: paidAmount > 0 ? [{ id: nextId * 10, amount: paidAmount }] : [],
      };
      state.expenses.unshift(expense);
      return expense;
    },
    updateExpense: (id, payload) => {
      const expense = state.expenses.find((item) => String(item.id) === String(id));
      if (!expense) return null;
      expense.amount =
        payload.amount !== undefined ? toNumeric(payload.amount, expense.amount) : expense.amount;
      expense.category = payload.category ?? expense.category;
      expense.description = payload.description ?? expense.description;
      expense.date = payload.date ? new Date(payload.date).toISOString() : expense.date;
      expense.paymentMethod = payload.paymentMethod ?? expense.paymentMethod;
      return expense;
    },
    deleteExpense: (id) => {
      const before = state.expenses.length;
      state.expenses = state.expenses.filter((expense) => String(expense.id) !== String(id));
      return before !== state.expenses.length;
    },
    getPurchases: () => state.purchases,
    createPurchase: (payload) => {
      const nextId =
        Math.max(0, ...state.purchases.map((purchase) => Number(purchase.id) || 0)) + 1;
      const totalAmount = toNumeric(payload.totalAmount, 0);
      const totalPaid = toNumeric(payload.paidAmount, 0);
      const dueAmount = Math.max(0, totalAmount - totalPaid);
      const purchase = {
        id: nextId,
        vendor: payload.vendor || 'N/A',
        totalAmount,
        totalPaid,
        dueAmount,
        paymentStatus: dueAmount > 0 ? 'Due' : 'Paid',
        paymentMethod: payload.paymentMethod || 'Cash',
        note: payload.note || '',
        date: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
        items: payload.items || [],
        payments: totalPaid > 0 ? [{ id: nextId * 10, amount: totalPaid }] : [],
      };
      state.purchases.unshift(purchase);
      return purchase;
    },
    updatePurchase: (id, payload) => {
      const purchase = state.purchases.find((item) => String(item.id) === String(id));
      if (!purchase) return null;
      purchase.vendor = payload.vendor ?? purchase.vendor;
      purchase.note = payload.note ?? purchase.note;
      purchase.date = payload.date ? new Date(payload.date).toISOString() : purchase.date;
      purchase.items = payload.items ?? purchase.items;
      return purchase;
    },
    deletePurchase: (id) => {
      const before = state.purchases.length;
      state.purchases = state.purchases.filter((purchase) => String(purchase.id) !== String(id));
      return before !== state.purchases.length;
    },
    getLooseSales: () => state.looseSales,
    createLooseSale: (payload) => {
      const nextId = state.nextLooseSaleId++;
      const sale = {
        id: nextId,
        itemName: payload.itemName,
        price: payload.price,
        createdAt: new Date().toISOString(),
      };
      state.looseSales.push(sale);
      return sale;
    },
    deleteLooseSale: (id) => {
      const before = state.looseSales.length;
      state.looseSales = state.looseSales.filter((sale) => String(sale.id) !== String(id));
      return before !== state.looseSales.length;
    },
    getPeriodicReport: () => ({
      ...state.periodicReport,
      sales: state.sales,
      looseSales: state.looseSales,
      expenses: state.expenses,
      purchases: state.purchases,
    }),
    getUsers: () => state.users,
    createUser: (user) => {
      const newUser = { id: Date.now(), ...user, status: 'active' };
      state.users.push(newUser);
      return newUser;
    },
    updateUser: (id, userData) => {
      const index = state.users.findIndex(u => String(u.id) === String(id));
      if (index === -1) return null;
      state.users[index] = { ...state.users[index], ...userData };
      return state.users[index];
    },
    deleteUser: (id) => {
      state.users = state.users.filter(u => String(u.id) !== String(id));
      return true;
    },
    getLowStockReport: () => {
      return state.products.filter(p => !p.isDeleted && p.totalQuantity <= (p.lowStockThreshold || 2));
    },
    getExpiryReport: ({ startDate, endDate }) => {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      const expiringBatches = [];
      state.products.forEach(product => {
        if (product.isDeleted) return;
        product.batches.forEach(batch => {
          if (!batch.expiryDate) return;
          const expiry = new Date(batch.expiryDate);
          if ((!start || expiry >= start) && (!end || expiry <= end)) {
            expiringBatches.push({
              ...batch,
              productName: product.name,
              category: product.category,
              barcode: product.barcode
            });
          }
        });
      });
      return expiringBatches;
    },
    getMonthlyReport: () => state.monthlyReport,
    getDailyReport: () => state.dailyReport,
  };
};
