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

/** An expense row as returned by /api/expenses. */
export interface ExpenseRow {
  id: number;
  date: string | Date;
  category?: string | null;
  amount: number;
}

/** A purchase row as returned by /api/purchases. */
export interface PurchaseRow {
  id: number;
  date: string | Date;
  vendor?: string | null;
  totalAmount: number;
}

/** A unified cash-flow line combining expenses and purchases. */
export interface CashFlowItem {
  id: string;
  date: Date;
  type: 'Expense' | 'Purchase';
  label: string;
  amount: number;
}

export function buildCashFlowItems(
  expenses: ExpenseRow[] = [],
  purchases: PurchaseRow[] = []
): CashFlowItem[] {
  return [
    ...expenses.map((e) => ({
      id: `exp-${e.id}`,
      date: new Date(e.date),
      type: 'Expense' as const,
      label: e.category || 'Misc',
      amount: e.amount,
    })),
    ...purchases.map((p) => ({
      id: `pur-${p.id}`,
      date: new Date(p.date),
      type: 'Purchase' as const,
      label: p.vendor || 'Unknown Vendor',
      amount: p.totalAmount,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** One slice of a category donut, with its precomputed gradient stop. */
export interface CategorySegment {
  name: string;
  value: number;
  percent: number;
  color: string;
}

export interface CategoryBreakdown {
  segments: CategorySegment[];
  /** Comma-joined conic-gradient stops (no `conic-gradient()` wrapper). */
  gradient: string;
}

export function buildCategorySegments<T extends Record<string, any>>(
  items: T[] = [],
  valueKey: keyof T & string,
  labelKey: keyof T & string
): CategoryBreakdown {
  const breakdown = items.reduce<Record<string, number>>((acc, item) => {
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
