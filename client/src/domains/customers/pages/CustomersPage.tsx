import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useCustomers, DEFAULT_CUSTOMER_SORT } from '@/domains/customers/hooks/useCustomers';
import { useCustomerLayout } from '@/domains/customers/hooks/useCustomerLayout';
import CustomerListTable from '@/domains/customers/components/CustomerListTable';
import CustomerDetailPanel from '@/domains/customers/components/CustomerDetailPanel';
import CustomerCardPreview from '@/domains/customers/components/CustomerCardPreview';
import EditCustomerDialog from '@/domains/customers/components/EditCustomerDialog';
import type { Customer } from '@/shared/api/customerService';

const CustomersPage = () => {
  const {
    customers,
    total,
    page,
    search,
    isLoading,
    selectedCustomer,
    historyData,
    isLoadingHistory,
    LIMIT,
    editingCustomer,
    openEdit,
    closeEdit,
    handleSaveEdit,
    sortBy,
    setSortBy,
    order,
    setOrder,
    setPage,
    handleSearchChange,
    openHistory,
    closeHistory,
  } = useCustomers();

  const { rightPanelWidth, handleResizeStartRight, isResizingRight } = useCustomerLayout();
  const [previewCustomer, setPreviewCustomer] = useState<Customer | null>(null);

  const handleResetFilters = () => {
    handleSearchChange('');
    setSortBy(DEFAULT_CUSTOMER_SORT.sortBy);
    setOrder(DEFAULT_CUSTOMER_SORT.order);
  };

  useEffect(() => {
    if (!selectedCustomer) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Let a foreground dialog (Edit/Preview) handle Escape itself first.
      if (e.key === 'Escape' && !editingCustomer && !previewCustomer) {
        closeHistory();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCustomer, editingCustomer, previewCustomer, closeHistory]);

  return (
    <Box
      sx={{
        bgcolor: '#f8fafc',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top Header Bar matching InventoryPage */}
      <Paper
        elevation={0}
        sx={{
          m: 1.5,
          px: 2.5,
          py: 1.75,
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}
          >
            Customer Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your customer database and view transaction histories.
          </Typography>
        </Box>
      </Paper>

      {/* Main Content: Table on the left, Resizer, and Detail Card on the right */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          minHeight: 0,
          px: 1.5,
          pb: 1.5,
          display: 'flex',
          gap: 1.5,
          alignItems: 'stretch',
        }}
      >
        {/* Customer List Card (Card 1) */}
        <CustomerListTable
          customers={customers}
          total={total}
          page={page}
          limit={LIMIT}
          isLoading={isLoading}
          sortBy={sortBy}
          setSortBy={setSortBy}
          order={order}
          setOrder={setOrder}
          onPageChange={setPage}
          onRowClick={openHistory}
          selectedCustomer={selectedCustomer}
          search={search}
          onSearchChange={handleSearchChange}
          onResetFilters={handleResetFilters}
        />

        {/* Resizer Handle: Centered in gap between Card 1 & Card 2 */}
        {selectedCustomer && (
          <Box
            onMouseDown={handleResizeStartRight}
            sx={{
              display: { xs: 'none', lg: 'flex' },
              width: '12px',
              mx: -1.5,
              cursor: 'col-resize',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              flexShrink: 0,
              '&:hover .handle': {
                bgcolor: 'primary.main',
                width: '4px',
              },
            }}
          >
            <Box
              className="handle"
              sx={{
                width: '2px',
                height: '60px',
                bgcolor: isResizingRight ? 'primary.main' : 'divider',
                borderRadius: '4px',
                transition: 'all 0.2s',
                ...(isResizingRight && { width: '4px' }),
              }}
            />
          </Box>
        )}

        {/* Customer Detail Side Card (Card 2) */}
        {selectedCustomer && (
          <Box
            sx={{
              width: { xs: '100%', lg: rightPanelWidth },
              minWidth: { lg: 320 },
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <CustomerDetailPanel
              customer={selectedCustomer}
              historyData={historyData}
              isLoadingHistory={isLoadingHistory}
              onClose={closeHistory}
              onEdit={openEdit}
              onPreviewCard={(c) => setPreviewCustomer(c)}
            />
          </Box>
        )}
      </Box>

      {/* Global Card Preview Dialog */}
      <CustomerCardPreview
        open={!!previewCustomer}
        onClose={() => setPreviewCustomer(null)}
        customer={previewCustomer}
        shopName="My Shop"
      />

      {/* Edit Customer Dialog */}
      <EditCustomerDialog
        open={!!editingCustomer}
        customer={editingCustomer}
        onClose={closeEdit}
        onSave={handleSaveEdit}
      />
    </Box>
  );
};

export default CustomersPage;
