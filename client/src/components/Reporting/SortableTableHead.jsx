import React from 'react';
import { TableHead, TableRow, TableCell, TableSortLabel } from '@mui/material';

const SortableTableHead = ({ columns, sortConfig, requestSort }) => {
  return (
    <TableHead>
      <TableRow>
        {columns.map((col) => (
          <TableCell
            key={col.id}
            align={col.align || 'left'}
            sx={{
              fontWeight: 800,
              bgcolor: '#f8fafc',
              color: '#64748b',
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
                  '&.MuiTableSortLabel-active': {
                    color: '#0f172a',
                  },
                  '& .MuiTableSortLabel-icon': {
                    color: '#64748b !important',
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
