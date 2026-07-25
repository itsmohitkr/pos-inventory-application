import React from 'react';
import { TableHead, TableRow, TableCell, TableSortLabel, Box } from '@mui/material';

import type { SxProps, Theme } from '@mui/material';
import type { SortDirection } from '@/shared/hooks/useSortableTable';

export interface SortableColumn {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  /** Per-column cell styling forwarded to the MUI TableCell. */
  sx?: SxProps<Theme>;
  width?: string | number;
  className?: string;
  /** Pulls a nested or computed value instead of reading `id` directly. */
  getter?: ((row: Record<string, any>) => unknown) | null; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface SortableTableHeadProps {
  columns: SortableColumn[];
  /**
   * Only `key` and `direction` are read here. Declaring exactly that (rather
   * than SortConfig<T>) keeps this component usable with any row type —
   * SortConfig<T> is invariant in T and would not accept a concrete row type.
   */
  sortConfig: { key: string; direction: SortDirection } | null;
  requestSort: (key: any, getter?: ((row: any) => unknown) | null) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const SortableTableHead = ({ columns, sortConfig, requestSort }: SortableTableHeadProps) => {
  return (
    <TableHead>
      <TableRow>
        {columns.map((col) => (
          <TableCell
            key={col.id}
            align={col.align || 'left'}
            sx={{
              fontWeight: 800,
              bgcolor: '#f1f5f9', // Slightly darker background for better contrast
              color: '#334155',    // Professional Slate color
              py: 1.5,             // Slightly more padding for elegance
              borderBottom: '2px solid #e2e8f0',
              fontSize: '0.8rem',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap', // Prevent header text from wrapping
              ...col.sx,
            }}
            sortDirection={sortConfig?.key === col.id ? sortConfig.direction : false}
            className={col.className || ''}
          >
            {col.sortable !== false ? (
              <TableSortLabel
                active={sortConfig?.key === col.id}
                direction={sortConfig?.key === col.id ? sortConfig.direction : 'asc'}
                onClick={() => requestSort(col.id, col.getter)}
                sx={{
                  color: 'inherit !important',
                  '&.MuiTableSortLabel-active': {
                    color: '#0f172a !important', // Darker color when active
                  },
                  '& .MuiTableSortLabel-icon': {
                    color: '#94a3b8 !important', // Distinct sort icon color
                  },
                }}
              >
                {col.label}
              </TableSortLabel>
            ) : (
              col.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

export default SortableTableHead;
