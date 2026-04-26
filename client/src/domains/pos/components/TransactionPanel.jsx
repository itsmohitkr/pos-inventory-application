import React from 'react';
import { Box, Typography, Paper, Divider, TextField, InputAdornment } from '@mui/material';
import { ReceiptLong as ReceiptIcon } from '@mui/icons-material';
import { PAYMENT_METHOD_CONFIG, getAvailablePaymentMethods } from '@/domains/pos/components/transactionPanelUtils';
import PriceBreakdownSection from '@/domains/pos/components/PriceBreakdownSection';
import ChangeCalculatorSection from '@/domains/pos/components/ChangeCalculatorSection';
import PaymentMethodButtons from '@/domains/pos/components/PaymentMethodButtons';
import TransactionActionButtons from '@/domains/pos/components/TransactionActionButtons';

const TransactionPanel = ({
  cart,
  discount,
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
  isPaying,
  receivedAmount,
  setReceivedAmount,
  setShowNumpad,
  setShowDiscountNumpad,
  decodedPricesEnabled,
  totalCostPrice,
}) => {
  const changeDue = Math.max(0, receivedAmount - totalAmount);

  React.useEffect(() => {
    if (totalAmount === 0) setReceivedAmount(0);
  }, [totalAmount, setReceivedAmount]);
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
              variant="outlined"
              size="small"
              placeholder="0.00"
              value={discount > 0 ? discount : ''}
              onClick={() => setShowDiscountNumpad(true)}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography color="text.secondary" variant="body2">
                      ₹
                    </Typography>
                  </InputAdornment>
                ),
                sx: {
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  '& .MuiInputBase-input': { cursor: 'pointer' },
                },
              }}
            />
          </Box>
        )}

        <PriceBreakdownSection subTotal={subTotal} discount={discount} totalAmount={totalAmount} />

        <ChangeCalculatorSection
          changeCalculatorEnabled={changeCalculatorEnabled}
          receivedAmount={receivedAmount}
          changeDue={changeDue}
          setShowNumpad={setShowNumpad}
        />
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
        {paymentMethodsEnabled && (
          <>
            <PaymentMethodButtons
              availableMethods={getAvailablePaymentMethods(paymentSettings)}
              selectedPaymentMethod={selectedPaymentMethod}
              onSelectPaymentMethod={onSelectPaymentMethod}
              cartEmpty={cart.length === 0}
            />
            <Divider sx={{ my: 1 }} />
          </>
        )}

        <TransactionActionButtons
          cartEmpty={cart.length === 0}
          selectedPaymentMethod={selectedPaymentMethod}
          hasLastSale={hasLastSale}
          isPaying={isPaying}
          onPay={onPay}
          onPayAndPrint={onPayAndPrint}
          onPrintLastReceipt={onPrintLastReceipt}
          onRefund={onRefund}
          onVoid={onVoid}
        />
      </Box>
    </Paper>
  );
};

export default TransactionPanel;
