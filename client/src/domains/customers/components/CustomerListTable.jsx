import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Paper, Typography, Skeleton, Chip, Box, IconButton, Tooltip,
} from '@mui/material';
import { Visibility as PreviewIcon, Edit as EditIcon } from '@mui/icons-material';
import { TableSortLabel } from '@mui/material';
import CustomerCardPreview from './CustomerCardPreview';

const CustomerListTable = ({
  customers, total, page, limit, isLoading,
  sortBy, setSortBy, order, setOrder,
  onPageChange, onRowClick, onEdit,
}) => {
  const [previewCustomer, setPreviewCustomer] = React.useState(null);

  const handlePreview = (e, customer) => {
    e.stopPropagation();
    setPreviewCustomer(customer);
  };

  const handleSort = (property) => {
    const isAsc = sortBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  if (isLoading && customers.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        {[...Array(8)].map((_, i) => <Skeleton key={i} height={52} sx={{ mb: 1 }} />)}
      </Box>
    );
  }

  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'phone', label: 'Phone Number' },
    { id: 'customerBarcode', label: 'Barcode' },
    { id: 'purchases', label: 'Purchases', align: 'right' },
    { id: 'totalSpend', label: 'Total Value', align: 'right' },
    { id: 'lastVisit', label: 'Last Visit' },
    { id: 'createdAt', label: 'Joined' },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <Paper 
        elevation={0} 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: '12px', 
          border: '1px solid #e2e8f0', 
          overflow: 'hidden',
          bgcolor: '#ffffff'
        }}
      >
        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    sortDirection={sortBy === column.id ? order : false}
                    sx={{
                      fontWeight: 700,
                      bgcolor: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      whiteSpace: 'nowrap',
                      color: '#475569',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      py: 1.5
                    }}
                  >
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                      sx={{
                        '&.Mui-active': { color: '#0f172a' },
                        '& .MuiTableSortLabel-icon': { color: '#0f172a !important', opacity: 1 }
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    py: 1.5
                  }}
                  align="right"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 700 }}>NO CUSTOMERS FOUND</Typography>
                    <Typography variant="caption" sx={{ color: '#cbd5e1' }}>Try adjusting your search criteria</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow
                    key={c.id}
                    hover
                    onClick={() => onRowClick(c)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{c.name || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>{c.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.customerBarcode}
                        size="small"
                        sx={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.65rem', 
                          fontWeight: 800,
                          bgcolor: '#f1f5f9',
                          color: '#475569',
                          borderRadius: '4px'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {c._count?.sales ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        ₹{c.totalSpend?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {formatDate(c.lastVisit)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {formatDate(c.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Preview Card">
                          <IconButton
                            size="small"
                            onClick={(e) => handlePreview(e, c)}
                            aria-label="Preview Card"
                            sx={{ color: '#3b82f6' }}
                          >
                            <PreviewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Details">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(c);
                            }}
                            aria-label="Edit Details"
                            sx={{ color: '#64748b' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ borderTop: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <TablePagination
            component="div"
            count={total}
            page={page - 1}
            rowsPerPage={limit}
            rowsPerPageOptions={[limit]}
            onPageChange={(_, newPage) => onPageChange(newPage + 1)}
            sx={{
              '& .MuiTablePagination-toolbar': { minHeight: 48 },
              '& .MuiTypography-root': { fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }
            }}
          />
        </Box>
      </Paper>
      <CustomerCardPreview
        open={!!previewCustomer}
        onClose={() => setPreviewCustomer(null)}
        customer={previewCustomer}
        shopName="My Shop"
      />
    </Box>
  );
};

export default CustomerListTable;
