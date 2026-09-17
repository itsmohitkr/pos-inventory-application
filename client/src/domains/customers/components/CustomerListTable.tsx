import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  Skeleton,
  Chip,
  Box,
  TableSortLabel,
} from '@mui/material';
import CustomerListSearchField from './CustomerListSearchField';
import CustomerListToolbar from './CustomerListToolbar';
import CustomerSummaryBar from './CustomerSummaryBar';
import { DEFAULT_CUSTOMER_SORT } from '@/domains/customers/hooks/useCustomers';
import { formatDateDisplay } from '@/utils/dateUtils';
import type { Customer } from '@/shared/api/customerService';

interface CustomerListTableProps {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  sortBy: string;
  setSortBy: (property: string) => void;
  order: 'asc' | 'desc';
  setOrder: (order: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
  onRowClick: (customer: Customer) => void;
  selectedCustomer?: Customer | null;
  search: string;
  onSearchChange: (value: string) => void;
  onResetFilters: () => void;
}

const columnTypographySx = {
  fontSize: '0.85rem',
  fontWeight: 500,
  color: '#334155',
};

export const CustomerListTable = ({
  customers,
  total,
  page,
  limit,
  isLoading,
  sortBy,
  setSortBy,
  order,
  setOrder,
  onPageChange,
  onRowClick,
  selectedCustomer,
  search,
  onSearchChange,
  onResetFilters,
}: CustomerListTableProps) => {
  const handleSort = (property: string) => {
    const isAsc = sortBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'phone', label: 'Phone Number' },
    { id: 'customerBarcode', label: 'Barcode' },
    { id: 'purchases', label: 'Purchases' },
    { id: 'totalSpend', label: 'Total Value' },
    { id: 'lastVisit', label: 'Last Visit' },
    { id: 'createdAt', label: 'Joined' },
  ];

  const formatDate = (dateString?: string | null) => (dateString ? formatDateDisplay(dateString) : '—');

  const hasActiveFilters = Boolean(
    search || sortBy !== DEFAULT_CUSTOMER_SORT.sortBy || order !== DEFAULT_CUSTOMER_SORT.order
  );

  const initialLoading = isLoading && customers.length === 0;

  // Avoid a skeleton flash for fast (local) fetches — only show it once
  // loading has genuinely taken a moment.
  const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(false);
  useEffect(() => {
    if (!initialLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowLoadingSkeleton(false);
      return;
    }
    const timer = setTimeout(() => setShowLoadingSkeleton(true), 200);
    return () => clearTimeout(timer);
  }, [initialLoading]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          bgcolor: '#ffffff',
          position: 'relative',
          minWidth: 0,
        }}
      >
        {/* Table Card Header matching Inventory ProductList */}
        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
              justifyContent: 'space-between',
            }}
          >
            {/* Title & subtitle */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: '#0b1d39',
                  lineHeight: 1.2,
                }}
              >
                Customers
              </Typography>
              {initialLoading ? (
                showLoadingSkeleton ? <Skeleton variant="text" width={140} height={16} /> : <Box sx={{ height: 16 }} />
              ) : (
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: '#64748b',
                    fontSize: '0.75rem',
                    lineHeight: 1,
                  }}
                >
                  All Registered ({total.toLocaleString()})
                </Typography>
              )}
            </Box>

            {/* Search and Toolbar controls */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <CustomerListSearchField
                value={search}
                onChange={onSearchChange}
                onClear={() => onSearchChange('')}
              />
              <CustomerListToolbar
                sortBy={sortBy}
                order={order}
                onSortChange={(newSort, newOrder) => {
                  setSortBy(newSort);
                  setOrder(newOrder);
                }}
                onReset={onResetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </Box>
          </Box>

          {/* Metric Summary Bar */}
          {initialLoading ? (
            showLoadingSkeleton ? <Skeleton variant="rounded" height={64} /> : <Box sx={{ height: 64 }} />
          ) : (
            <CustomerSummaryBar totalCount={total} customers={customers} />
          )}
        </Box>

        {/* Main Table Container */}
        <TableContainer sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  align="left"
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap',
                    color: '#475569',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    py: 1.25,
                    px: 1.5,
                    width: '5%',
                    minWidth: '50px',
                  }}
                >
                  S.No.
                </TableCell>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align="left"
                    sortDirection={sortBy === column.id ? order : false}
                    sx={{
                      fontWeight: 700,
                      bgcolor: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      whiteSpace: 'nowrap',
                      color: '#475569',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      py: 1.25,
                      px: 1.5,
                    }}
                  >
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                      sx={{
                        '& .MuiTableSortLabel-icon': { color: '#0b1d39 !important', opacity: 1 },
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {initialLoading ? (
                showLoadingSkeleton
                  ? [...Array(8)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={8} sx={{ py: 1.25, px: 1.5 }}>
                          <Skeleton height={28} />
                        </TableCell>
                      </TableRow>
                    ))
                  : null
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                      NO CUSTOMERS FOUND
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
                      Try adjusting your search criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c, idx) => {
                  const isSelected = selectedCustomer?.id === c.id;
                  return (
                    <TableRow
                      key={c.id}
                      hover
                      onClick={() => onRowClick(c)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: isSelected ? 'rgba(11, 29, 57, 0.08)' : 'transparent',
                        '&:hover': {
                          bgcolor: isSelected ? 'rgba(11, 29, 57, 0.12)' : '#f8fafc',
                        },
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* S.No. */}
                      <TableCell
                        sx={{
                          py: 1.25,
                          px: 1.5,
                          width: '5%',
                          minWidth: '50px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Typography variant="body2" sx={columnTypographySx}>
                          {(page - 1) * limit + idx + 1}
                        </Typography>
                      </TableCell>

                      {/* Name */}
                      <TableCell sx={{ py: 1.25, px: 1.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                            fontSize: '0.85rem',
                            textTransform: 'capitalize',
                          }}
                        >
                          {c.name || '—'}
                        </Typography>
                      </TableCell>

                      {/* Phone */}
                      <TableCell sx={{ py: 1.25, px: 1.5 }}>
                        <Typography variant="body2" sx={columnTypographySx}>
                          {c.phone || '—'}
                        </Typography>
                      </TableCell>

                      {/* Barcode */}
                      <TableCell sx={{ py: 1.25, px: 1.5 }}>
                        <Typography variant="body2" sx={columnTypographySx}>
                          {c.customerBarcode || '—'}
                        </Typography>
                      </TableCell>

                      {/* Purchases */}
                      <TableCell sx={{ py: 1.25, px: 1.5 }}>
                        <Typography variant="body2" sx={columnTypographySx}>
                          {c._count?.sales ?? 0}
                        </Typography>
                      </TableCell>

                      {/* Total Value */}
                      <TableCell sx={{ py: 1.25, px: 1.5 }}>
                        <Typography variant="body2" sx={columnTypographySx}>
                          ₹{c.totalSpend?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                        </Typography>
                      </TableCell>

                      {/* Last Visit */}
                      <TableCell sx={{ py: 1.25, px: 1.5 }}>
                        <Typography variant="body2" sx={columnTypographySx}>
                          {formatDate(c.lastVisit)}
                        </Typography>
                      </TableCell>

                      {/* Joined */}
                      <TableCell sx={{ py: 1.25, px: 1.5 }}>
                        <Typography variant="body2" sx={columnTypographySx}>
                          {formatDate(c.createdAt)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Footer */}
        <Box sx={{ borderTop: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <TablePagination
            component="div"
            count={total}
            page={page - 1}
            rowsPerPage={limit}
            rowsPerPageOptions={[limit]}
            onPageChange={(_, newPage) => onPageChange(newPage + 1)}
            sx={{
              '& .MuiTablePagination-toolbar': { minHeight: 44, px: 2 },
              '& .MuiTypography-root': { fontWeight: 600, color: '#64748b', fontSize: '0.75rem' },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default CustomerListTable;
