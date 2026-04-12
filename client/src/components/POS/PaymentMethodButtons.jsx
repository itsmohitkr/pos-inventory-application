import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import {
  Money as CashIcon,
  QrCode2 as UpiIcon,
  CreditCard as CardIcon,
  AccountBalanceWallet as WalletIcon,
  AccountBalance as BankIcon,
  Description as ChequeIcon,
  TagFaces as CustomIcon,
} from '@mui/icons-material';

const ICON_MAP = {
  cash: CashIcon,
  upi: UpiIcon,
  card: CardIcon,
  wallet: WalletIcon,
  bank_transfer: BankIcon,
  cheque: ChequeIcon,
};

const getIconForMethod = (methodId) => {
  const IconComponent = ICON_MAP[methodId];
  return IconComponent ? <IconComponent /> : <CustomIcon />;
};

const PaymentMethodButtons = React.memo(
  ({ availableMethods, selectedPaymentMethod, onSelectPaymentMethod, cartEmpty }) => {
    return (
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
          {availableMethods.map((method) => (
            <Button
              key={method.id}
              variant={selectedPaymentMethod?.id === method.id ? 'contained' : 'outlined'}
              color={selectedPaymentMethod?.id === method.id ? 'primary' : 'inherit'}
              className="pos-action-btn"
              onClick={() => onSelectPaymentMethod(method)}
              size="large"
              disabled={cartEmpty}
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
                bgcolor: selectedPaymentMethod?.id === method.id ? 'primary.light' : 'action.hover',
                color:
                  selectedPaymentMethod?.id === method.id ? 'primary.contrastText' : 'text.primary',
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
              startIcon={getIconForMethod(method.id)}
            >
              {method.label}
            </Button>
          ))}
        </Box>
        {!cartEmpty && !selectedPaymentMethod && (
          <Typography
            variant="caption"
            color="error.main"
            sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}
          >
            Please select a payment method
          </Typography>
        )}
      </Box>
    );
  }
);

PaymentMethodButtons.displayName = 'PaymentMethodButtons';

export default PaymentMethodButtons;
