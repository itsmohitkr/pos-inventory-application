export const getLocalTodayString = () => {
  const timezoneOffset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - timezoneOffset).toISOString().slice(0, -1).split('T')[0];
};

export const splitIsoDate = (isoString) => isoString.split('T')[0];

export const buildCustomDateRange = (customDates) => {
  const startDate = customDates.start
    ? (() => {
        const [y, m, d] = customDates.start.split('-').map(Number);
        return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
      })()
    : undefined;

  const endDate = customDates.end
    ? (() => {
        const [y, m, d] = customDates.end.split('-').map(Number);
        return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
      })()
    : undefined;

  return { startDate, endDate };
};

export const getExpenseDateRange = (type, customDates) => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (type) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'yesterday':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      break;
    case 'thisWeek': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    }
    case 'lastWeek': {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diffToMonday - 7, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), diffToMonday - 1, 23, 59, 59, 999);
      break;
    }
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'thisYear':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'lastYear':
      start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    case 'custom':
      return buildCustomDateRange(customDates);
    default:
      return {};
  }

  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

export const filterExpenses = (expenses, expenseCategoryFilter, expenseSearchFilter) =>
  expenses.filter((expense) => {
    if (expenseCategoryFilter !== 'All' && expense.category !== expenseCategoryFilter) {
      return false;
    }

    if (expenseSearchFilter) {
      const normalizedSearch = expenseSearchFilter.toLowerCase();
      const descriptionMatch = expense.description?.toLowerCase().includes(normalizedSearch);
      const categoryMatch = expense.category.toLowerCase().includes(normalizedSearch);
      if (!descriptionMatch && !categoryMatch) {
        return false;
      }
    }

    return true;
  });

export const filterPurchases = (
  purchases,
  purchaseStatusFilter,
  purchaseVendorFilter,
  purchaseSearchFilter
) =>
  purchases.filter((purchase) => {
    if (purchaseStatusFilter !== 'All' && purchase.paymentStatus !== purchaseStatusFilter) {
      return false;
    }

    if (purchaseVendorFilter !== 'All' && purchase.vendor !== purchaseVendorFilter) {
      return false;
    }

    if (purchaseSearchFilter) {
      const normalizedSearch = purchaseSearchFilter.toLowerCase();
      const vendorMatch = purchase.vendor?.toLowerCase().includes(normalizedSearch);
      const noteMatch = purchase.note?.toLowerCase().includes(normalizedSearch);
      if (!vendorMatch && !noteMatch) {
        return false;
      }
    }

    return true;
  });

export const calculateExpenseTotals = (filteredExpenses, filteredPurchases) => ({
  totalExpensesAmount: filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
  totalExpensesDue: filteredExpenses.reduce((sum, expense) => sum + (expense.dueAmount || 0), 0),
  totalPurchasesAmount: filteredPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0),
  totalPurchasesDue: filteredPurchases.reduce(
    (sum, purchase) => sum + (purchase.dueAmount || 0),
    0
  ),
});
