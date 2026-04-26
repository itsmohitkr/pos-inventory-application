import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Print as PrintIcon,
  Replay as ReplayIcon,
  DeleteForever as DeleteIcon,
} from '@mui/icons-material';

const TransactionActionButtons = React.memo(
  ({
    cartEmpty,
    selectedPaymentMethod,
    hasLastSale,
    isPaying,
    onPay,
    onPayAndPrint,
    onPrintLastReceipt,
    onRefund,
    onVoid,
  }) => {
    const paymentDisabled = cartEmpty || !selectedPaymentMethod || isPaying;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Pay & Pay & Print buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            size="large"
            className="pos-action-btn"
            onClick={onPay}
            disabled={paymentDisabled}
            startIcon={<CheckCircleIcon />}
            sx={{
              height: 64,
              fontWeight: 'bold',
              fontSize: '1.1rem',
              whiteSpace: 'normal',
              lineHeight: 1.2,
              bgcolor: 'success.light',
              color: 'success.contrastText',
              transition: 'background 0.2s, color 0.2s',
              position: 'relative',
              '&:hover': {
                bgcolor: 'success.main',
                color: 'success.contrastText',
              },
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="button" sx={{ fontWeight: 900 }}>
                Pay
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                [F10]
              </Typography>
            </Box>
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="info"
            size="large"
            className="pos-action-btn"
            onClick={onPayAndPrint}
            disabled={paymentDisabled}
            startIcon={<PrintIcon />}
            sx={{
              height: 64,
              fontWeight: 'bold',
              fontSize: '1.1rem',
              whiteSpace: 'normal',
              lineHeight: 1.2,
              bgcolor: 'info.light',
              color: 'info.contrastText',
              transition: 'background 0.2s, color 0.2s',
              position: 'relative',
              '&:hover': {
                bgcolor: 'info.main',
                color: 'info.contrastText',
              },
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="button" sx={{ fontWeight: 900 }}>
                Pay & Print
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                [F11]
              </Typography>
            </Box>
          </Button>
        </Box>

        {/* Last Receipt, Return, Void Order buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            size="large"
            className="pos-action-btn"
            onClick={onPrintLastReceipt}
            disabled={!hasLastSale}
            startIcon={<PrintIcon />}
            sx={{
              flex: 1,
              height: 64,
              fontWeight: 'bold',
              fontSize: '0.85rem',
              whiteSpace: 'normal',
              lineHeight: 1.2,
              bgcolor: 'secondary.light',
              color: 'secondary.contrastText',
              transition: 'background 0.2s, color 0.2s',
              '&:hover': {
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
              },
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'text.disabled',
              },
            }}
          >
            Last Receipt
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="warning"
            size="large"
            className="pos-action-btn"
            onClick={onRefund}
            startIcon={<ReplayIcon />}
            sx={{
              flex: 1,
              height: 64,
              fontWeight: 'bold',
              fontSize: '0.85rem',
              whiteSpace: 'normal',
              lineHeight: 1.2,
              bgcolor: 'warning.light',
              color: 'warning.contrastText',
              transition: 'background 0.2s, color 0.2s',
              '&:hover': {
                bgcolor: 'warning.main',
                color: 'warning.contrastText',
              },
            }}
          >
            Return
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="error"
            size="large"
            className="pos-action-btn"
            onClick={onVoid}
            disabled={cartEmpty}
            startIcon={<DeleteIcon />}
            sx={{
              flex: 1,
              height: 64,
              fontWeight: 'bold',
              fontSize: '0.85rem',
              whiteSpace: 'normal',
              lineHeight: 1.2,
              bgcolor: 'error.light',
              color: 'error.contrastText',
              transition: 'background 0.2s, color 0.2s',
              '&:hover': {
                bgcolor: 'error.main',
                color: 'error.contrastText',
              },
            }}
          >
            Void Order
          </Button>
        </Box>
      </Box>
    );
  }
);

TransactionActionButtons.displayName = 'TransactionActionButtons';

export default TransactionActionButtons;
