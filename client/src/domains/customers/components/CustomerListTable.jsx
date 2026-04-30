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
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
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
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <TableSortLabel
                    active={sortBy === column.id}
                    direction={sortBy === column.id ? order : 'asc'}
                    onClick={() => handleSort(column.id)}
                    sx={{
                      '&.Mui-active': { color: 'primary.main' },
                      '& .MuiTableSortLabel-icon': { color: 'primary.main !important' }
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
                  borderBottom: '2px solid',
                  borderColor: 'divider'
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
                <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow
                  key={c.id}
                  hover
                  onClick={() => onRowClick(c)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2">{c.name || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{c.phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.customerBarcode}
                      size="small"
                      sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {c._count?.sales ?? 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      ₹{c.totalSpend?.toLocaleString() || '0'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(c.lastVisit)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(c.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="Preview Card">
                        <IconButton
                          size="small"
                          onClick={(e) => handlePreview(e, c)}
                          sx={{ color: 'primary.main' }}
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

      <CustomerCardPreview
        open={Boolean(previewCustomer)}
        onClose={() => setPreviewCustomer(null)}
        customer={previewCustomer}
      />

      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        rowsPerPage={limit}
        rowsPerPageOptions={[limit]}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
      />
    </Paper>
  );
};

export default CustomerListTable;
