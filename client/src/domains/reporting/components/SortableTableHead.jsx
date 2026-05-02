import React from 'react';
import { TableHead, TableRow, TableCell, TableSortLabel, Box } from '@mui/material';

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
