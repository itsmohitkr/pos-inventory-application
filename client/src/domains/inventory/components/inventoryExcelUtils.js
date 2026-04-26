export const flattenInventoryRows = (products, localCategoryFilter) => {
  const rows = [];

  const filteredProducts =
    localCategoryFilter === 'all'
      ? products
      : products.filter((product) => product.category === localCategoryFilter);

  filteredProducts.forEach((product) => {
    if (product.batches && product.batches.length > 0) {
      product.batches.forEach((batch) => {
        const discRsVendor = Math.max(0, batch.mrp - batch.costPrice);
        const discPctVendor = batch.mrp > 0 ? (discRsVendor / batch.mrp) * 100 : 0;

        const discRsCust = Math.max(0, batch.mrp - batch.sellingPrice);
        const discPctCust = batch.mrp > 0 ? (discRsCust / batch.mrp) * 100 : 0;

        let stockStatus = 'In Stock';
        if (batch.quantity <= 0) stockStatus = 'Out of Stock';
        else if (batch.quantity <= (product.minStockLevel || 5)) stockStatus = 'Low Stock';

        const marginPct =
          batch.sellingPrice > 0
            ? ((batch.sellingPrice - batch.costPrice) / batch.sellingPrice) * 100
            : 0;

        rows.push({
          id: `${product.id}-${batch.id}`,
          name: product.name,
          stockStatus,
          batchCode: batch.batchCode || 'N/A',
          category: product.category || 'Uncategorized',
          mrp: batch.mrp,
          sp: batch.sellingPrice,
          cp: batch.costPrice,
          profitRs: batch.sellingPrice - batch.costPrice,
          discRsVendor,
          discPctVendor,
          discRsCust,
          discPctCust,
          marginPct,
          barcode: product.barcode || 'N/A',
          expiry: batch.expiryDate,
          wsPrice: batch.wholesalePrice,
          wsMinQty: batch.wholesaleMinQty,
          lowStockEnabled: product.lowStockWarningEnabled,
          batchTrackingEnabled: product.batchTrackingEnabled,
          stock: batch.quantity,
          totalValCp: batch.quantity * batch.costPrice,
          totalValSp: batch.quantity * batch.sellingPrice,
          createdAt: batch.createdAt || product.createdAt || 'N/A',
        });
      });
      return;
    }

    rows.push({
      id: `${product.id}-none`,
      name: product.name,
      stockStatus: 'Out of Stock',
      batchCode: 'N/A',
      category: product.category || 'Uncategorized',
      mrp: 0,
      sp: 0,
      cp: 0,
      profitRs: 0,
      discRsVendor: 0,
      discPctVendor: 0,
      discRsCust: 0,
      discPctCust: 0,
      marginPct: 0,
      barcode: product.barcode || 'N/A',
      wsPrice: null,
      wsMinQty: null,
      lowStockEnabled: product.lowStockWarningEnabled,
      batchTrackingEnabled: product.batchTrackingEnabled,
      stock: 0,
      totalValCp: 0,
      totalValSp: 0,
      createdAt: product.createdAt || 'N/A',
    });
  });

  return rows;
};

export const applyInventorySearch = (rows, searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) {
    return rows;
  }

  const query = searchTerm.toLowerCase().trim();
  const namePrefix = [];
  const barcodePrefix = [];
  const nameContains = [];
  const barcodeContains = [];

  for (const row of rows) {
    const name = (row.name || '').toLowerCase();
    const barcodes =
      row.barcode && row.barcode !== 'N/A'
        ? row.barcode
          .toLowerCase()
          .split('|')
          .map((barcode) => barcode.trim())
        : [];

    if (name.startsWith(query)) {
      namePrefix.push(row);
    } else if (barcodes.some((barcode) => barcode.startsWith(query))) {
      barcodePrefix.push(row);
    } else if (name.includes(query)) {
      nameContains.push(row);
    } else if (barcodes.some((barcode) => barcode.includes(query))) {
      barcodeContains.push(row);
    }
  }

  return [...namePrefix, ...barcodePrefix, ...nameContains, ...barcodeContains];
};

export const applyInventorySort = (rows, sortConfigs) => {
  if (!sortConfigs.length) {
    return rows;
  }

  return [...rows].sort((a, b) => {
    for (const config of sortConfigs) {
      let valA = a[config.key];
      let valB = b[config.key];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      const isDesc = config.direction === 'desc';

      if (valA < valB) return isDesc ? 1 : -1;
      if (valA > valB) return isDesc ? -1 : 1;
    }

    return 0;
  });
};

export const calculateInventoryTotals = (rows) => {
  const totalStock = rows.reduce((sum, row) => sum + row.stock, 0);
  const totalValueCost = rows.reduce((sum, row) => sum + row.stock * row.cp, 0);
  const totalValueSelling = rows.reduce((sum, row) => sum + row.stock * row.sp, 0);
  const totalValueMrp = rows.reduce((sum, row) => sum + row.stock * (row.mrp || row.sp), 0);

  return {
    totalStock,
    avgSp: totalStock > 0 ? totalValueSelling / totalStock : 0,
    avgCp: totalStock > 0 ? totalValueCost / totalStock : 0,
    avgDiscRsVendor: totalStock > 0 ? (totalValueMrp - totalValueCost) / totalStock : 0,
    avgDiscPctVendor:
      totalValueMrp > 0 ? ((totalValueMrp - totalValueCost) / totalValueMrp) * 100 : 0,
    avgDiscRsCust: totalStock > 0 ? (totalValueMrp - totalValueSelling) / totalStock : 0,
    avgDiscPctCust:
      totalValueMrp > 0 ? ((totalValueMrp - totalValueSelling) / totalValueMrp) * 100 : 0,
    avgMargin:
      totalValueSelling > 0 ? ((totalValueSelling - totalValueCost) / totalValueSelling) * 100 : 0,
    avgWsPrice:
      rows.length > 0 ? rows.reduce((sum, row) => sum + (row.wsPrice || 0), 0) / rows.length : 0,
    totalValueCost,
    totalValueSelling,
  };
};

export const buildInventoryCsv = (cols, rows) => {
  const headers = [];
  if (cols.sno) headers.push('S.No');
  if (cols.name) headers.push('Name');
  if (cols.stockStatus) headers.push('Status');
  if (cols.batchCode) headers.push('Batch Code');
  if (cols.category) headers.push('Category');
  if (cols.mrp) headers.push('MRP');
  if (cols.sp) headers.push('Selling Price');
  if (cols.cp) headers.push('Cost Price');
  if (cols.profitRs) headers.push('Profit Unit(Rs)');
  if (cols.discRsVendor) headers.push('Disc Vendor(Rs)');
  if (cols.discPctVendor) headers.push('Disc Vendor(%)');
  if (cols.discRsCust) headers.push('Disc Cust(Rs)');
  if (cols.discPctCust) headers.push('Disc Cust(%)');
  if (cols.marginPct) headers.push('Margin(%)');
  if (cols.barcode) headers.push('Barcode');
  if (cols.expiry) headers.push('Expiry');
  if (cols.wsPrice) headers.push('WS Price');
  if (cols.wsMinQty) headers.push('WS Min Qty');
  if (cols.stock) headers.push('Stock');
  if (cols.totalValCp) headers.push('Total Value (Cost)');
  if (cols.totalValSp) headers.push('Total Rev (Selling)');
  if (cols.createdAt) headers.push('Added On');

  return [
    headers.join(','),
    ...rows.map((row, idx) => {
      const rowData = [];
      if (cols.sno) rowData.push(idx + 1);
      if (cols.name) rowData.push(`"${row.name}"`);
      if (cols.stockStatus) rowData.push(`"${row.stockStatus}"`);
      if (cols.batchCode) rowData.push(`"${row.batchCode}"`);
      if (cols.category) rowData.push(`"${row.category}"`);
      if (cols.mrp) rowData.push(row.mrp);
      if (cols.sp) rowData.push(row.sp);
      if (cols.cp) rowData.push(row.cp);
      if (cols.profitRs) rowData.push(row.profitRs.toFixed(2));
      if (cols.discRsVendor) rowData.push(row.discRsVendor.toFixed(2));
      if (cols.discPctVendor) rowData.push(row.discPctVendor.toFixed(2));
      if (cols.discRsCust) rowData.push(row.discRsCust.toFixed(2));
      if (cols.discPctCust) rowData.push(row.discPctCust.toFixed(2));
      if (cols.marginPct) rowData.push(row.marginPct.toFixed(2));
      if (cols.barcode) rowData.push(`"${row.barcode}"`);
      if (cols.expiry) rowData.push(row.expiry ? new Date(row.expiry).toLocaleDateString() : 'N/A');
      if (cols.wsPrice) rowData.push(row.wsPrice || 0);
      if (cols.wsMinQty) rowData.push(row.wsMinQty || 0);
      if (cols.stock) rowData.push(row.stock);
      if (cols.totalValCp) rowData.push(row.totalValCp.toFixed(2));
      if (cols.totalValSp) rowData.push(row.totalValSp.toFixed(2));
      if (cols.createdAt)
        rowData.push(
          row.createdAt !== 'N/A' ? new Date(row.createdAt).toLocaleDateString() : 'N/A'
        );
      return rowData.join(',');
    }),
  ].join('\n');
};

export const getInventoryExpiryColor = (expiryStr) => {
  if (!expiryStr || expiryStr === 'N/A' || expiryStr === '—') return 'inherit';

  const expDate = new Date(expiryStr);
  const today = new Date();
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '#ffebee';
  if (diffDays <= 30) return '#fff3e0';
  return 'inherit';
};
