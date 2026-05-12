import React from 'react';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import { People as PeopleIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useCustomers } from '@/domains/customers/hooks/useCustomers';
import CustomerSearchBar from '@/domains/customers/components/CustomerSearchBar';
import CustomerListTable from '@/domains/customers/components/CustomerListTable';
import CustomerHistoryDrawer from '@/domains/customers/components/CustomerHistoryDrawer';
import EditCustomerDialog from '@/domains/customers/components/EditCustomerDialog';

const CustomersPage = () => {
  const {
    customers, total, page, search, isLoading,
    selectedCustomer, historyData, isLoadingHistory, LIMIT,
    editingCustomer, openEdit, closeEdit, handleSaveEdit,
    sortBy, setSortBy, order, setOrder,
    setPage, handleSearchChange, openHistory, closeHistory, fetchCustomers,
  } = useCustomers();

  return (
    <Box
      sx={{
        bgcolor: '#f8fafc',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header Bar */}
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
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}>
            Customer Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your customer database and view transaction histories.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ textAlign: 'right', mr: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', letterSpacing: '0.5px' }}>
              TOTAL RECOGNIZED
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0b1d39', lineHeight: 1 }}>
              {total.toLocaleString()}
            </Typography>
          </Box>
          <Button
            size="medium"
            startIcon={<RefreshIcon />}
            onClick={() => fetchCustomers(page, search)}
            variant="outlined"
            sx={{ 
              borderRadius: '10px', 
              fontWeight: 700, 
              textTransform: 'none',
              borderColor: '#e2e8f0',
              color: '#475569',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 0, px: 1.5, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Search Toolbar */}
        <Box sx={{ px: 1 }}>
          <CustomerSearchBar value={search} onChange={handleSearchChange} />
        </Box>

        {/* Table Container */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
            onEdit={openEdit}
          />
        </Box>
      </Box>

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
