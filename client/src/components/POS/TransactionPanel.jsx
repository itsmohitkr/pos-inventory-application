import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  ReceiptLong as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Replay as ReplayIcon,
  Print as PrintIcon,
  Payment as PaymentIcon,
  DeleteForever as DeleteIcon,
  Money as CashIcon,
  QrCode2 as UpiIcon,
  CreditCard as CardIcon,
  AccountBalanceWallet as WalletIcon,
  AccountBalance as BankIcon,
  Description as ChequeIcon,
  TagFaces as CustomIcon,
} from '@mui/icons-material';

const PAYMENT_METHOD_OPTIONS = {
  cash: { label: 'Cash', color: '#16a34a', icon: <CashIcon /> },
  upi: { label: 'UPI', color: '#0369a1', icon: <UpiIcon /> },
  card: { label: 'Card', color: '#7c3aed', icon: <CardIcon /> },
  wallet: { label: 'Digital Wallet', color: '#ea580c', icon: <WalletIcon /> },
  bank_transfer: { label: 'Bank Transfer', color: '#0891b2', icon: <BankIcon /> },
  cheque: { label: 'Cheque', color: '#64748b', icon: <ChequeIcon /> },
};

const TransactionPanel = ({
  cart,
  discount,
  onDiscountChange,
  onVoid,
  onPay,
  onPayAndPrint,
  onRefund,
  onSelectPaymentMethod,
  selectedPaymentMethod,
  paymentSettings,
  extraDiscountEnabled,
  subTotal,
  totalQty,
  totalAmount,
  totalSavings,
  changeCalculatorEnabled,
  paymentMethodsEnabled,
  onPrintLastReceipt,
  hasLastSale,
  receivedAmount,
  setReceivedAmount,
  setShowNumpad,
  decodedPricesEnabled,
  totalCostPrice,
}) => {
  const changeDue = Math.max(0, receivedAmount - totalAmount);

  React.useEffect(() => {
    if (totalAmount === 0) setReceivedAmount(0);
  }, [totalAmount, setReceivedAmount]);
  const getAvailablePaymentMethods = () => {
    const enabled = paymentSettings?.enabledMethods || [];
    const custom = paymentSettings?.customMethods || [];

    const methods = Object.entries(PAYMENT_METHOD_OPTIONS)
      .filter(([id]) => enabled.includes(id))
      .map(([id, config]) => ({ id, ...config }));

    custom.forEach((m) => {
      methods.push({
        id: m.id,
        label: m.label,
        color: '#64748b',
        icon: <CustomIcon />,
      });
    });

    return methods;
  };
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 'auto', lg: '100%' },
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          color: 'primary.contrastText',
          background: 'linear-gradient(135deg, #0b1d39 0%, #1b3e6f 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <ReceiptIcon fontSize="small" /> Checkout
        </Typography>

        {decodedPricesEnabled && (
          <Box sx={{ display: 'flex', gap: 0, alignItems: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.4)', // Faint color
                letterSpacing: 1,
              }}
            >
              [{Math.round(totalCostPrice || 0)}][
              {Math.round((totalAmount || 0) - (totalCostPrice || 0))}]
            </Typography>
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box
        sx={{
          p: 1.5,
          flexGrow: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {/* Stats - Compact Single Row */}
        <Paper
          elevation={0}
          sx={{
            p: 1,
            bgcolor: 'background.default',
            display: 'flex',
            justifyContent: 'space-around',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              ITEMS
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {cart.length}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              QTY
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {totalQty}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box
            sx={{
              textAlign: 'center',
              border: '1px dashed rgba(242, 181, 68, 0.6)',
              borderRadius: 1,
              px: 1,
              py: 0.5,
              bgcolor: 'rgba(242, 181, 68, 0.08)',
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontSize: '0.75rem', color: '#b76e00', fontWeight: 700 }}
            >
              Customer Savings
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#b76e00' }}>
              ₹{totalSavings.toFixed(0)}
            </Typography>
          </Box>
        </Paper>

        {/* Discount Field - Compact - Conditionally shown */}
        {extraDiscountEnabled && (
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="600"
              sx={{ display: 'block', mb: 0.5, fontSize: '0.75rem' }}
            >
              Extra Discount
            </Typography>
            <TextField
              fullWidth
              type="number"
              variant="outlined"
              size="small"
              placeholder="0.00"
              value={discount > 0 ? discount : ''}
              onChange={(e) => onDiscountChange(Number(e.target.value))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography color="text.secondary" variant="body2">
                      ₹
                    </Typography>
                  </InputAdornment>
                ),
                sx: { fontSize: '0.875rem' },
              }}
            />
          </Box>
        )}

        {/* Price Breakdown */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body1" color="text.secondary" fontWeight="bold">
              Subtotal
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              ₹{subTotal.toFixed(2)}
            </Typography>
          </Box>
          {discount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body1" color="error.main" fontWeight="bold">
                Discount
              </Typography>
              <Typography variant="body1" color="error.main" fontWeight="bold">
                - ₹{discount.toFixed(2)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Net Payable - More Compact */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            bgcolor: 'rgba(31, 138, 91, 0.12)',
            border: '1px solid rgba(31, 138, 91, 0.2)',
            borderRadius: 1,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="caption"
            color="success.main"
            fontWeight="bold"
            sx={{ fontSize: '0.7rem' }}
          >
            NET PAYABLE
          </Typography>
          <Typography
            variant="h4"
            fontWeight="bold"
            color="success.dark"
            sx={{ letterSpacing: -0.5 }}
          >
            ₹{totalAmount.toFixed(2)}
          </Typography>
        </Paper>

        {/* Change Calculator Section - Premium Redesign */}
        {changeCalculatorEnabled && (
          <Box
            sx={{
              mb: 1,
              p: 1.5,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'rgba(0,0,0,0.01)',
            }}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
            >
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.05em' }}
              >
                Change Calculator
              </Typography>
              <Chip
                label="F9"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box
                onClick={() => setShowNumpad(true)}
                sx={{
                  bgcolor: '#f8fafc', // Very light blue-grey
                  p: 1.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { borderColor: 'primary.main', bgcolor: '#f1f5f9' },
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: 65,
                  flex: 1,
                  maxWidth: '46%',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0.5, fontWeight: 700, fontSize: '0.8rem' }}
                >
                  Received Amount
                </Typography>
                <Typography variant="h5" fontWeight="900" color="primary.main">
                  ₹{receivedAmount.toFixed(0)}
                </Typography>
              </Box>

              <Box
                sx={{
                  bgcolor: '#f5f3ff', // Very light indigo/violet
                  p: 1.5,
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  color: '#4f46e5',
                  border: '1px solid',
                  borderColor: '#e0e7ff',
                  minHeight: 65,
                  flex: 1,
                  maxWidth: '46%',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mb: 0.5,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: 'indigo.500',
                  }}
                >
                  Return Amount
                </Typography>
                <Typography variant="h5" fontWeight="900">
                  ₹{changeDue.toFixed(0)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Actions Footer - Fixed at bottom */}
      <Box
        sx={{
          p: 1.5,
          bgcolor: 'background.paper',
          borderTop: '1px solid rgba(16, 24, 40, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {/* Payment Methods Section - Compact */}
        {paymentMethodsEnabled && (
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="600"
              sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}
            >
              Payment Method
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 1,
              }}
            >
              {getAvailablePaymentMethods().map((method) => (
                <Button
                  key={method.id}
                  variant={selectedPaymentMethod?.id === method.id ? 'contained' : 'outlined'}
                  color={selectedPaymentMethod?.id === method.id ? 'primary' : 'inherit'}
                  className="pos-action-btn"
                  onClick={() => onSelectPaymentMethod(method)}
                  size="large"
                  disabled={cart.length === 0}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1.5,
                    px: 1,
                    fontSize: '1rem',
                    minHeight: 56,
                    width: '100%',
                    lineHeight: 1.2,
                    textAlign: 'center',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    border: '1px solid rgba(16, 24, 40, 0.12)',
                    borderColor:
                      selectedPaymentMethod?.id === method.id
                        ? 'primary.main'
                        : 'rgba(16, 24, 40, 0.12)',
                    bgcolor:
                      selectedPaymentMethod?.id === method.id ? 'primary.light' : 'action.hover',
                    color:
                      selectedPaymentMethod?.id === method.id
                        ? 'primary.contrastText'
                        : 'text.primary',
                    transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                    '&:hover': {
                      bgcolor:
                        selectedPaymentMethod?.id === method.id ? 'primary.main' : 'primary.light',
                      color: 'primary.contrastText',
                      borderColor: 'primary.main',
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'rgba(0,0,0,0.04)',
                      borderColor: 'rgba(0,0,0,0.08)',
                    },
                  }}
                  startIcon={method.icon}
                >
                  {method.label}
                </Button>
              ))}
            </Box>
            {cart.length > 0 && !selectedPaymentMethod && (
              <Typography
                variant="caption"
                color="error.main"
                sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}
              >
                Please select a payment method
              </Typography>
            )}
          </Box>
        )}

        {paymentMethodsEnabled && <Divider sx={{ my: 1 }} />}

        {/* Action Buttons - Compact */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            size="large"
            className="pos-action-btn"
            onClick={onPay}
            disabled={cart.length === 0 || !selectedPaymentMethod}
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
            disabled={cart.length === 0 || !selectedPaymentMethod}
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
                [F12]
              </Typography>
            </Box>
          </Button>
        </Box>
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
            disabled={cart.length === 0}
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
    </Paper>
  );
};

export default TransactionPanel;
