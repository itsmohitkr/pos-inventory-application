import React from 'react';
import type { Expense } from '@/domains/expenses/components/expenseTypes';
import {
  Box, Typography, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter, Chip, IconButton, Autocomplete, InputAdornment, Menu, MenuItem, Popover, Tooltip, Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Payment as PaymentIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { EXPENSE_CATEGORIES } from '@/domains/expenses/components/useExpenseManagement';

interface ExpenseListTabProps {
  filteredExpenses: Expense[];
  /** 'All' or a category name. */
  expenseCategoryFilter: string;
  setExpenseCategoryFilter: (value: string) => void;
  expenseSearchFilter: string;
  setExpenseSearchFilter: (value: string) => void;
  totalExpensesAmount: number;
  totalExpensesDue: number;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: number) => void;
  onOpenPaymentDialog: (expense: Expense) => void;
  selectedExpense?: Expense | null;
  onSelectExpense?: (expense: Expense | null) => void;
}

const columnTypographySx = {
  fontSize: '0.85rem',
  fontWeight: 500,
  color: '#334155',
};

const ExpenseListTab = ({
  filteredExpenses,
  expenseCategoryFilter, setExpenseCategoryFilter,
  expenseSearchFilter, setExpenseSearchFilter,
  totalExpensesAmount, totalExpensesDue,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onOpenPaymentDialog,
  selectedExpense,
  onSelectExpense,
}: ExpenseListTabProps) => {
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [activeExpense, setActiveExpense] = React.useState<Expense | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
  const hasActiveFilters = expenseCategoryFilter !== 'All';

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, expense: Expense) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setActiveExpense(expense);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setActiveExpense(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#0b1d39',
              lineHeight: 1.2,
            }}
          >
            Operating Expenses
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'nowrap' }}>
          <TextField
            size="small"
            placeholder="Search descriptions..."
            value={expenseSearchFilter}
            onChange={(e) => setExpenseSearchFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(31, 41, 55, 0.6)', fontSize: '1.1rem' }} />
                </InputAdornment>
              ),
              endAdornment: expenseSearchFilter ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setExpenseSearchFilter('')} edge="end">
                    <ClearIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              width: { xs: '100%', sm: 220, md: 260, lg: 280 },
              maxWidth: 320,
              '& .MuiOutlinedInput-root': {
                color: '#1f2937',
                fontSize: '0.85rem',
                bgcolor: '#ffffff',
                height: '36px',
                borderRadius: '6px',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#cbd5e1' },
                '&.Mui-focused fieldset': { borderColor: '#0b1d39' },
              },
              '& .MuiOutlinedInput-input': {
                padding: '0 12px',
                '&::placeholder': { color: 'rgba(31, 41, 55, 0.5)', opacity: 1 },
              },
            }}
          />

          {/* Filter Button */}
          <Tooltip title="Filter options">
            <IconButton
              size="small"
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              aria-label="Filter options"
              sx={{
                height: '36px',
                width: '36px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: hasActiveFilters ? '#0b1d39' : '#e2e8f0',
                bgcolor: hasActiveFilters ? 'rgba(11, 29, 57, 0.08)' : '#ffffff',
                color: hasActiveFilters ? '#0b1d39' : '#1f2937',
                '&:hover': {
                  borderColor: hasActiveFilters ? '#0b1d39' : '#cbd5e1',
                  bgcolor: hasActiveFilters ? 'rgba(11, 29, 57, 0.12)' : 'rgba(31, 41, 55, 0.05)',
                },
              }}
            >
              <Badge
                color="secondary"
                variant="dot"
                invisible={!hasActiveFilters}
                sx={{ '& .MuiBadge-badge': { right: -2, top: -2 } }}
              >
                <FilterListIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Add Expense Button */}
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<AddIcon fontSize="small" />}
            onClick={onAddExpense}
            sx={{
              height: '36px',
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
              px: 1.5,
              whiteSpace: 'nowrap',
              bgcolor: '#0b1d39',
              '&:hover': {
                bgcolor: '#1e293b',
              },
            }}
          >
            Add Expense
          </Button>
        </Box>
      </Box>

    {/* Filter Popover for Category */}
    <Popover
      open={Boolean(filterAnchorEl)}
      anchorEl={filterAnchorEl}
      onClose={() => setFilterAnchorEl(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            width: 280,
            p: 2,
            borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            border: '1px solid #e2e8f0',
            mt: 0.5,
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
          Filter Expenses
        </Typography>
        {hasActiveFilters && (
          <Button
            size="small"
            onClick={() => {
              setExpenseCategoryFilter('All');
            }}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              p: 0,
              minWidth: 0,
              color: '#ef4444',
              '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
            }}
          >
            Reset
          </Button>
        )}
      </Box>

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 0.5, display: 'block' }}>
          Category
        </Typography>
        <Autocomplete
          size="small"
          options={['All', ...EXPENSE_CATEGORIES]}
          value={expenseCategoryFilter}
          onChange={(e, val) => setExpenseCategoryFilter(val || 'All')}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select category"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: '#ffffff',
                  fontSize: '0.82rem',
                  py: '2px !important',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#cbd5e1' },
                  '&.Mui-focused fieldset': { borderColor: '#0b1d39' },
                },
              }}
            />
          )}
        />
      </Box>
    </Popover>

    <TableContainer
      sx={{
        flex: 1,
        overflow: 'auto',
        overflowX: 'auto',
        bgcolor: '#ffffff',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 transparent',
        '&::-webkit-scrollbar': {
          height: '6px',
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#cbd5e1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#94a3b8',
        },
      }}
    >
      <Table size="small" stickyHeader sx={{ width: '100%' }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'background.default', borderBottom: '1px solid #e2e8f0' }}>
            <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5, py: 1, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', bgcolor: '#f8fafc' }}>
              DATE
            </TableCell>
            <TableCell sx={{ px: 1.5, py: 1, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', bgcolor: '#f8fafc' }}>
              CATEGORY
            </TableCell>
            <TableCell sx={{ px: 1.5, py: 1, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', bgcolor: '#f8fafc' }}>
              DESCRIPTION
            </TableCell>
            <TableCell align="center" sx={{ px: 1.5, py: 1, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', bgcolor: '#f8fafc' }}>
              METHOD
            </TableCell>
            <TableCell align="right" sx={{ px: 1.5, py: 1, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', bgcolor: '#f8fafc' }}>
              AMOUNT (₹)
            </TableCell>
            <TableCell align="right" sx={{ px: 1.5, py: 1, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', bgcolor: '#f8fafc' }}>
              DUE (₹)
            </TableCell>
            <TableCell sx={{ px: 1.5, py: 1, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', bgcolor: '#f8fafc' }}>
              STATUS
            </TableCell>
            <TableCell align="center" sx={{ px: 1.5, py: 1, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', bgcolor: '#f8fafc' }}>
              ACTIONS
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredExpenses.map((row) => {
            const isSelected = selectedExpense?.id === row.id;

            return (
              <TableRow
                key={row.id}
                onClick={() => onSelectExpense?.(isSelected ? null : row)}
                hover
                sx={{
                  cursor: 'pointer',
                  bgcolor: isSelected ? 'rgba(11, 29, 57, 0.08)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #0b1d39' : '3px solid transparent',
                  '& td': { px: 1.5, py: 1 },
                }}
              >
                <TableCell sx={{ px: 1.5, py: 1 }}>
                  <Typography variant="body2" sx={columnTypographySx}>
                    {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                    {new Date(row.date).getFullYear()}
                  </Typography>
                </TableCell>
                <TableCell sx={{ px: 1.5, py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary', textTransform: 'capitalize' }}>
                    {row.category || '—'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', px: 1.5, py: 1 }}>
                  <Typography variant="body2" sx={{ ...columnTypographySx, textTransform: 'capitalize' }}>
                    {row.description}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ px: 1.5, py: 1 }}>
                  <Typography variant="body2" sx={{ ...columnTypographySx, textTransform: 'uppercase' }}>
                    {row.paymentMethod || 'CASH'}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ px: 1.5, py: 1 }}>
                  <Typography variant="body2" sx={columnTypographySx}>
                    {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ px: 1.5, py: 1 }}>
                  {(row.dueAmount || 0) > 0 ? (
                    <Typography variant="body2" sx={{ ...columnTypographySx, color: '#ef4444' }}>
                      {(row.dueAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                  ) : (
                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, fontSize: '0.72rem' }}>
                      SETTLED
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ px: 1.5, py: 1 }}>
                  <Chip
                    label={row.paymentStatus?.toUpperCase() || 'PAID'}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      height: 20,
                      borderRadius: '4px',
                      bgcolor: row.paymentStatus === 'Paid' ? '#f0fdf4' : row.paymentStatus === 'Due' ? '#fffbeb' : '#fef2f2',
                      color: row.paymentStatus === 'Paid' ? '#166534' : row.paymentStatus === 'Due' ? '#92400e' : '#991b1b',
                      border: `1px solid ${row.paymentStatus === 'Paid' ? '#16a34a' : row.paymentStatus === 'Due' ? '#f59e0b' : '#dc2626'}`,
                    }}
                  />
                </TableCell>
                <TableCell align="center" sx={{ px: 1.5, py: 1 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenMenu(e, row)}
                    aria-label="Expense options"
                    sx={{
                      p: 0.5,
                      color: '#64748b',
                      borderRadius: '6px',
                      '&:hover': { color: '#0b1d39', bgcolor: 'rgba(11, 29, 57, 0.05)' },
                    }}
                  >
                    <MoreVertIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
          {filteredExpenses.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                <Box sx={{ opacity: 0.6 }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 800 }}>NO EXPENSES FOUND</Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Try adjusting your filters or date range</Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {filteredExpenses.length > 0 && (
          <TableFooter
            sx={{
              position: 'sticky',
              bottom: 0,
              bgcolor: '#f8fafc',
              zIndex: 2,
              borderTop: '2px solid #e2e8f0',
              '& .MuiTableCell-root': { border: 'none', px: 1.5, py: 1 }
            }}
          >
            <TableRow>
              <TableCell colSpan={4} align="right" sx={{ px: 1.5, py: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  PERIOD TOTALS
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ px: 1.5, py: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#3b82f6', display: 'block', fontSize: '0.65rem' }}>TOTAL (₹)</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '0.85rem' }}>
                  {totalExpensesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ px: 1.5, py: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#ef4444', display: 'block', fontSize: '0.65rem' }}>DUE (₹)</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.85rem' }}>
                  {totalExpensesDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>

    {/* Three-dot action menu */}
    <Menu
      anchorEl={menuAnchorEl}
      open={Boolean(menuAnchorEl)}
      onClose={handleCloseMenu}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
          border: '1px solid #e2e8f0',
          minWidth: 140,
          py: 0.5,
        },
      }}
    >
      {activeExpense && (activeExpense.dueAmount || 0) > 0 && (
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpenPaymentDialog(activeExpense);
            handleCloseMenu();
          }}
          sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#16a34a', gap: 1.25, py: 0.75 }}
        >
          <PaymentIcon sx={{ fontSize: 16, color: '#16a34a' }} />
          Record Payment
        </MenuItem>
      )}
      <MenuItem
        onClick={(e) => {
          e.stopPropagation();
          if (activeExpense) {
            onEditExpense(activeExpense);
          }
          handleCloseMenu();
        }}
        sx={{ fontSize: '0.82rem', fontWeight: 600, gap: 1.25, py: 0.75 }}
      >
        <EditIcon sx={{ fontSize: 16, color: '#2563eb' }} />
        Edit
      </MenuItem>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation();
          if (activeExpense) {
            onDeleteExpense(activeExpense.id);
          }
          handleCloseMenu();
        }}
        sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#dc2626', gap: 1.25, py: 0.75 }}
      >
        <DeleteIcon sx={{ fontSize: 16, color: '#dc2626' }} />
        Delete
      </MenuItem>
    </Menu>
  </Box>
  );
};

export default ExpenseListTab;

