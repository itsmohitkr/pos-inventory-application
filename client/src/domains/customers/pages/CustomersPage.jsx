import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { People as PeopleIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useCustomers } from '@/domains/customers/hooks/useCustomers';
import CustomerSearchBar from '@/domains/customers/components/CustomerSearchBar';
import CustomerListTable from '@/domains/customers/components/CustomerListTable';
import CustomerHistoryDrawer from '@/domains/customers/components/CustomerHistoryDrawer';
import EditCustomerDialog from '@/domains/customers/components/EditCustomerDialog';

const CustomersPage = ({ whatsappEnabled, shopName }) => {
  const {
    customers, total, page, search, isLoading,
    selectedCustomer, historyData, isLoadingHistory, LIMIT,
    editingCustomer, openEdit, closeEdit, handleSaveEdit,
    setPage, handleSearchChange, openHistory, closeHistory, fetchCustomers,
  } = useCustomers();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', px: 3, py: 2, gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PeopleIcon color="primary" />
        <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
          Customers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {total} total
        </Typography>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => fetchCustomers(page, search)}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {/* Search */}
      <CustomerSearchBar value={search} onChange={handleSearchChange} />

      {/* Table */}
      <CustomerListTable
        customers={customers}
        total={total}
        page={page}
        limit={LIMIT}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowClick={openHistory}
        onEdit={openEdit}
        whatsappEnabled={whatsappEnabled}
        shopName={shopName}
      />

      {/* History Drawer */}
      <CustomerHistoryDrawer
        open={!!selectedCustomer}
        customer={selectedCustomer}
        historyData={historyData}
        isLoading={isLoadingHistory}
        onClose={closeHistory}
      />

      {/* Edit Dialog */}
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
