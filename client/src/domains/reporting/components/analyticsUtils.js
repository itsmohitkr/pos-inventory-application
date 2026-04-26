export const CATEGORY_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#64748b',
];

export function buildCashFlowItems(expenses = [], purchases = []) {
  return [
    ...expenses.map((e) => ({
      id: `exp-${e.id}`,
      date: new Date(e.date),
      type: 'Expense',
      label: e.category || 'Misc',
      amount: e.amount,
    })),
    ...purchases.map((p) => ({
      id: `pur-${p.id}`,
      date: new Date(p.date),
      type: 'Purchase',
      label: p.vendor || 'Unknown Vendor',
      amount: p.totalAmount,
    })),
  ].sort((a, b) => b.date - a.date);
}

export function buildCategorySegments(items = [], valueKey, labelKey) {
  const breakdown = items.reduce((acc, item) => {
    const key = item[labelKey] || 'Other';
    acc[key] = (acc[key] || 0) + (item[valueKey] || 0);
    return acc;
  }, {});

  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, val]) => sum + val, 0);

  let cumulative = 0;
  const segments = entries.map(([name, val], idx) => {
    const percent = total > 0 ? (val / total) * 100 : 0;
    return { name, value: val, percent, color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] };
  });

  const gradient = segments
    .map((seg) => {
      const start = cumulative;
      cumulative += seg.percent;
      return `${seg.color} ${start}% ${cumulative}%`;
    })
    .join(', ');

  return { segments, gradient };
}
