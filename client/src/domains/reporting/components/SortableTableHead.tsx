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
              fontWeight: 700,
              bgcolor: '#f8fafc',
              color: '#475569',
              py: 1.25,
              px: 1.5,
              borderBottom: '1px solid #e2e8f0',
              fontSize: '0.75rem',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
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
                  flexDirection: 'row !important',
                  '&.MuiTableSortLabel-active': {
                    color: '#0b1d39 !important',
                  },
                  '& .MuiTableSortLabel-icon': {
                    color: '#0b1d39 !important',
                    opacity: 1,
                    marginLeft: '4px !important',
                    marginRight: '0 !important',
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
