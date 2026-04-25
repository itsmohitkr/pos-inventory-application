export const calculateSaleStats = (sale) => {
  if (!sale) return { total: 0, mrpDiscount: 0, extraDiscount: 0, discountPercent: 0 };

  let mrpDiscount = 0;
  sale.items?.forEach((item) => {
    const mrp = item.mrp || item.sellingPrice;
    mrpDiscount += (mrp - item.sellingPrice) * item.quantity;
  });

  const extraDiscount = sale.extraDiscount || 0;
  const totalDiscount = mrpDiscount + extraDiscount;

  let subtotal = 0;
  sale.items?.forEach((item) => {
    const mrp = item.mrp || item.sellingPrice;
    subtotal += mrp * item.quantity;
  });

  const discountPercent = subtotal > 0 ? ((totalDiscount / subtotal) * 100).toFixed(2) : 0;

  return {
    total: sale.netTotalAmount || sale.totalAmount,
    mrpDiscount,
    extraDiscount,
    totalDiscount,
    discountPercent,
  };
};
