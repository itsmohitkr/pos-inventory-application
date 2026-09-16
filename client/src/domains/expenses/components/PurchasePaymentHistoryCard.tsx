import React from 'react';
import type { Expense, PaymentRecord, Purchase } from '@/domains/expenses/components/expenseTypes';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Stack,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  History as HistoryIcon,
  Payment as PaymentIcon,
  MoreVert as MoreVertIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

interface PurchasePaymentHistoryCardProps {
  purchase?: Purchase | null;
  expense?: Expense | null;
  onClose: () => void;
  onOpenPaymentDialog: (item: Purchase | Expense) => void;
  onOpenPaymentMenu: (event: React.MouseEvent<HTMLElement>, payment: PaymentRecord) => void;
  width?: number;
}

const PurchasePaymentHistoryCard = ({
  purchase,
  expense,
  onClose,
  onOpenPaymentDialog,
  onOpenPaymentMenu,
  width = 400,
}: PurchasePaymentHistoryCardProps) => {
  const isExpense = Boolean(expense && !purchase);
  const target = purchase || expense;
  if (!target) return null;

  const payments = target.payments || [];
  const latestPaymentId = payments.length > 0 ? payments[payments.length - 1]?.id : null;
  const isDue = (target.dueAmount ?? 0) > 0;

  const totalAmount = isExpense ? (target as Expense).amount : (target as Purchase).totalAmount;
  const totalPaid = target.totalPaid ?? 0;
  const dueAmount = target.dueAmount ?? 0;
  const paymentStatus = target.paymentStatus;
  const note = isExpense ? (target as Expense).description : (target as Purchase).note;

  return (
    <Paper
      elevation={0}
      sx={{
        width: { xs: '100%', lg: width },
        minWidth: { lg: 300 },
        bgcolor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* 1. Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: 'rgba(11, 29, 57, 0.08)',
              color: '#0b1d39',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isExpense ? <ReceiptIcon sx={{ fontSize: 18 }} /> : <HistoryIcon sx={{ fontSize: 18 }} />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Payment History
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#64748b',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            >
              {isExpense
                ? `${(target as Expense).category || 'Expense'}${note ? ` · ${note}` : ''} · ${new Date(target.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}`
                : `${(target as Purchase).vendor || 'Unknown Vendor'} · ${new Date(target.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}`}
            </Typography>
          </Box>
        </Box>

        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close payment history"
          sx={{
            color: '#64748b',
            bgcolor: 'rgba(15, 23, 42, 0.04)',
            borderRadius: '6px',
            p: 0.5,
            '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.08)', color: '#0f172a' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* 2. Scrollable Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Summary Metrics */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: '8px',
              bgcolor: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: '#2563eb', fontWeight: 700, display: 'block', fontSize: '0.65rem' }}
            >
              TOTAL (₹)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.25 }}>
              {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.25,
              borderRadius: '8px',
              bgcolor: 'rgba(22, 163, 74, 0.05)',
              border: '1px solid rgba(22, 163, 74, 0.2)',
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: '#16a34a', fontWeight: 700, display: 'block', fontSize: '0.65rem' }}
            >
              PAID (₹)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#15803d', mt: 0.25 }}>
              {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.25,
              borderRadius: '8px',
              bgcolor: isDue ? 'rgba(239, 68, 68, 0.05)' : 'rgba(100, 116, 139, 0.05)',
              border: isDue ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(100, 116, 139, 0.2)',
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: isDue ? '#dc2626' : '#64748b', fontWeight: 700, display: 'block', fontSize: '0.65rem' }}
            >
              DUE (₹)
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: isDue ? '#b91c1c' : '#475569', mt: 0.25 }}
            >
              {dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>

        {/* Status & Quick Action Row */}
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>
              Status:
            </Typography>
            <Chip
              label={paymentStatus?.toUpperCase() || 'PAID'}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.65rem',
                height: 20,
                borderRadius: '4px',
                bgcolor:
                  paymentStatus === 'Paid'
                    ? '#f0fdf4'
                    : paymentStatus === 'Due'
                    ? '#fffbeb'
                    : '#fef2f2',
                color:
                  paymentStatus === 'Paid'
                    ? '#166534'
                    : paymentStatus === 'Due'
                    ? '#92400e'
                    : '#991b1b',
                border: `1px solid ${
                  paymentStatus === 'Paid'
                    ? '#16a34a'
                    : paymentStatus === 'Due'
                    ? '#f59e0b'
                    : '#dc2626'
                }`,
              }}
            />
          </Stack>

          {isDue && (
            <Button
              size="small"
              variant="contained"
              startIcon={<PaymentIcon sx={{ fontSize: '15px !important' }} />}
              onClick={() => onOpenPaymentDialog(target)}
              sx={{
                bgcolor: '#16a34a',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.4,
                px: 1.5,
                borderRadius: '6px',
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#15803d',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                },
              }}
            >
              Record Payment
            </Button>
          )}
        </Stack>

        {note && (
          <Box
            sx={{
              p: 1.25,
              borderRadius: '8px',
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', display: 'block' }}>
              {isExpense ? 'Expense Description:' : 'Purchase Note:'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.8rem', mt: 0.25 }}>
              {note}
            </Typography>
          </Box>
        )}

        <Divider sx={{ borderColor: '#e2e8f0' }} />

        {/* Recorded Payments Table */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1, fontSize: '0.82rem' }}>
            Recorded Payments ({payments.length})
          </Typography>

          {payments.length > 0 ? (
            <TableContainer
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                maxHeight: 280,
                overflowY: 'auto',
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 1.25,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        bgcolor: '#f8fafc',
                        color: '#475569',
                      }}
                    >
                      DATE
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 1.25,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        bgcolor: '#f8fafc',
                        color: '#475569',
                      }}
                    >
                      METHOD
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 1.25,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        bgcolor: '#f8fafc',
                        color: '#475569',
                      }}
                    >
                      NOTE
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        py: 1,
                        px: 1.25,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        bgcolor: '#f8fafc',
                        color: '#475569',
                      }}
                    >
                      AMOUNT (₹)
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        py: 1,
                        px: 1,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        bgcolor: '#f8fafc',
                        color: '#475569',
                        width: 40,
                      }}
                    />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...payments].reverse().map((payment) => {
                    const isLatest = payment.id === latestPaymentId;

                    return (
                      <TableRow key={payment.id} hover>
                        <TableCell sx={{ py: 1, px: 1.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#1e293b' }}>
                            {new Date(payment.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: '2-digit',
                            })}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                            {new Date(payment.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1, px: 1.25 }}>
                          <Chip
                            label={payment.paymentMethod || 'Cash'}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              bgcolor: 'rgba(15, 23, 42, 0.06)',
                              color: '#334155',
                              borderRadius: '4px',
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 1,
                            px: 1.25,
                            maxWidth: 120,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            {payment.note || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1, px: 1.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#15803d' }}>
                            {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0.5, px: 0.5 }}>
                          {isLatest && (
                            <IconButton
                              size="small"
                              onClick={(e) => onOpenPaymentMenu(e, payment)}
                              aria-label="Payment options"
                              sx={{
                                p: 0.5,
                                color: '#64748b',
                                '&:hover': { color: '#0f172a', bgcolor: 'rgba(15, 23, 42, 0.06)' },
                              }}
                            >
                              <MoreVertIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box
              sx={{
                py: 4,
                px: 2,
                textAlign: 'center',
                bgcolor: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1',
              }}
            >
              <ReceiptIcon sx={{ fontSize: 28, color: '#94a3b8', mb: 0.5 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>
                No Payments Recorded
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                {isExpense ? 'Payments logged for this expense will show up here.' : 'Payments logged for this purchase will show up here.'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default PurchasePaymentHistoryCard;
