import React from 'react';
import { Box, TablePagination } from '@mui/material';

interface ReportTablePaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  rowsPerPageOptions?: number[];
}

const DEFAULT_ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const ReportTablePagination: React.FC<ReportTablePaginationProps> = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
}) => {
  if (count === 0) return null;

  return (
    <Box sx={{ borderTop: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
      <TablePagination
        component="div"
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(e) => {
          const nextRows = parseInt(e.target.value, 10);
          onRowsPerPageChange(nextRows);
        }}
        sx={{
          '& .MuiTablePagination-toolbar': { minHeight: 44, px: 2 },
          '& .MuiTypography-root': { fontWeight: 600, color: '#64748b', fontSize: '0.75rem' },
          '& .MuiTablePagination-select': { fontSize: '0.75rem', fontWeight: 600, color: '#334155' },
          '& .MuiTablePagination-actions button': { color: '#0b1d39' },
          '& .MuiTablePagination-actions button.Mui-disabled': { color: '#cbd5e1' },
        }}
      />
    </Box>
  );
};

export default ReportTablePagination;
