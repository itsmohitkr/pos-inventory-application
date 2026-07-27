import React from 'react';
import type {
  Expense,
  PaymentRecord,
  Purchase,
} from '@/domains/expenses/components/expenseTypes';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import { History as HistoryIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';

/**
 * Unified payment history dialog for both purchases and expenses.
 * Props:
 *   open, onClose, title,
 *   subject  — the purchase or expense object
 *   totalField — 'totalAmount' (for purchases) | 'amount' (for expenses)
 *   onOpenPaymentMenu(event, payment)
 */
interface PaymentHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** The purchase or expense whose payments are listed; null closes the list. */
  subject?: Purchase | Expense | null;
  /** Which field on `subject` holds the amount owed. */
  totalField: 'totalAmount' | 'amount';
  onOpenPaymentMenu: (event: React.MouseEvent<HTMLElement>, payment: PaymentRecord) => void;
}

/**
 * The owed amount lives under a different field on each shape — `amount` on an
 * Expense, `totalAmount` on a Purchase — so the union cannot be indexed
 * directly. Narrowed with `in` rather than cast.
 */
const readSubjectTotal = (
  subject: Purchase | Expense | null | undefined,
  totalField: 'totalAmount' | 'amount'
): number => {
  if (!subject) return 0;
  if (totalField === 'amount') return 'amount' in subject ? subject.amount : 0;
  return 'totalAmount' in subject ? subject.totalAmount : 0;
};

const PaymentHistoryDialog = ({
  open,
  onClose,
  title,
  subject,
  totalField,
  onOpenPaymentMenu,
}: PaymentHistoryDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <HistoryIcon color="primary" /> {title}
    </DialogTitle>
    <DialogContent dividers>
      {subject && (
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Amount
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                ₹{readSubjectTotal(subject, totalField).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Paid
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                ₹{Number(subject.totalPaid ?? 0).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Due Amount
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="error.main">
                ₹{Number(subject.dueAmount ?? 0).toLocaleString()}
              </Typography>
            </Box>
          </Stack>

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Recorded Payments
          </Typography>
          {subject.payments && subject.payments.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Note</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...(subject.payments || [])].reverse().map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.date).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </TableCell>
                      <TableCell>{payment.paymentMethod || 'Cash'}</TableCell>
                      <TableCell>{payment.note || '-'}</TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 1,
                          }}
                        >
                          <Typography sx={{ fontWeight: 'medium', color: 'success.main' }}>
                            ₹{payment.amount.toLocaleString()}
                          </Typography>
                          <IconButton size="small" onClick={(e) => onOpenPaymentMenu(e, payment)}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
              No payment records found.
            </Box>
          )}
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default PaymentHistoryDialog;
