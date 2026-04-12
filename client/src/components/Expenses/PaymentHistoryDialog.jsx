import React from 'react';
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
const PaymentHistoryDialog = ({ open, onClose, title, subject, totalField, onOpenPaymentMenu }) => (
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
                ₹{Number(subject[totalField] ?? 0).toLocaleString()}
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
