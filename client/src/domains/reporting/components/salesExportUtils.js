import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getRefundStatus, getStatusDisplay } from '@/shared/utils/refundStatus';

export const exportSalesToPDF = (sales, timeframeLabel, totals) => {
  if (!sales || sales.length === 0) return;

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Sales History', 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Timeframe: ${timeframeLabel}`, 14, 28);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

  const tableColumn = [
    'Date & Time',
    'Order ID',
    'Cost',
    'Amount',
    'Profit',
    'Margin',
    'Payment',
    'Status',
  ];
  const tableRows = [];

  sales.forEach((sale) => {
    const refundStatus = getRefundStatus(sale.items);
    const display = getStatusDisplay(refundStatus);
    const cost = (sale.netTotalAmount || 0) - (sale.profit || 0);
    const margin =
      sale.netTotalAmount > 0 ? ((sale.profit / sale.netTotalAmount) * 100).toFixed(1) : 0;

    const rowData = [
      sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'N/A',
      `#${sale.id}`,
      `Rs ${cost.toFixed(2)}`,
      `Rs ${(sale.netTotalAmount || 0).toFixed(2)}`,
      `Rs ${(sale.profit || 0).toFixed(2)}`,
      `${margin}%`,
      sale.paymentMethod || 'Cash',
      display.label,
    ];
    tableRows.push(rowData);
  });

  // Add summary row to PDF
  const avgMargin = totals.amount > 0 ? ((totals.profit / totals.amount) * 100).toFixed(1) : 0;
  tableRows.push([
    {
      content: 'TOTAL SUMMARY',
      colSpan: 2,
      styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
    },
    {
      content: `Rs ${totals.cost.toFixed(2)}`,
      styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
    },
    {
      content: `Rs ${totals.amount.toFixed(2)}`,
      styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
    },
    {
      content: `Rs ${totals.profit.toFixed(2)}`,
      styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
    },
    { content: `${avgMargin}%`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    { content: '', colSpan: 2, styles: { fillColor: [241, 245, 249] } },
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'striped',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [25, 118, 210] },
  });

  doc.save(`sales_history_${timeframeLabel.replace(/\s+/g, '_').toLowerCase()}.pdf`);
};
