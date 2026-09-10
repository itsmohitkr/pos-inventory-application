import React, { useState } from 'react';
import type { PaymentSettings } from '@/shared/utils/paymentSettings';
import {
  Paper,
  Typography,
  Stack,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  Box,
  Chip,
  Divider,
  FormGroup,
  Alert,
} from '@mui/material';
import { Payment as PaymentIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  STORAGE_KEYS,
  DEFAULT_PAYMENT_SETTINGS,
} from '@/shared/utils/paymentSettings';

const PAYMENT_METHOD_OPTIONS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'wallet', label: 'Digital Wallet', icon: '💰' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { id: 'cheque', label: 'Cheque', icon: '📄' },
];

interface PaymentSettingsPanelProps {
  paymentSettings: PaymentSettings;
  setPaymentSettings: (settings: PaymentSettings) => void;
  /** Reveals the encoded cost price on the POS product list. */
  showDecodedPrices: boolean;
  setShowDecodedPrices: (show: boolean) => void;
}

const PaymentSettingsPanel = ({
  paymentSettings,
  setPaymentSettings,
  showDecodedPrices,
  setShowDecodedPrices
}: PaymentSettingsPanelProps) => {
  const [customMethod, setCustomMethod] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handlePaymentMethodToggle = (methodId: string) => {
    const isEnabling = !paymentSettings.enabledMethods.includes(methodId);

    setPaymentSettings({
      ...paymentSettings,
      enabledMethods: isEnabling
        ? [...paymentSettings.enabledMethods, methodId]
        : paymentSettings.enabledMethods.filter((m) => m !== methodId),
    });
  };

  const handleAddCustomMethod = () => {
    if (customMethod.trim()) {
      setPaymentSettings({
        ...paymentSettings,
        customMethods: [
          ...paymentSettings.customMethods,
          { id: `custom_${Date.now()}`, label: customMethod },
        ],
      });
      setCustomMethod('');
      setShowCustomInput(false);
    }
  };

  const handleRemoveCustomMethod = (methodId: string) => {
    setPaymentSettings({
      ...paymentSettings,
      customMethods: paymentSettings.customMethods.filter((m) => m.id !== methodId),
    });
  };

  const handleMultiplePaymentToggle = () => {
    setPaymentSettings({
      ...paymentSettings,
      allowMultplePayment: !paymentSettings.allowMultplePayment,
    });
  };

  const handleDecodedPricesToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowDecodedPrices(event.target.checked);
  };

  const enabledCount = paymentSettings.enabledMethods.length;

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 2.5,
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: '8px',
              bgcolor: 'rgba(11, 29, 57, 0.08)',
              color: '#0b1d39',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PaymentIcon fontSize="small" />
          </Box>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '1.05rem', lineHeight: 1.2 }}>
                Payment Settings
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.78rem' }}>
                Configure tender methods, custom payment modes, and checkout price display
              </Typography>
            </Box>
            <Chip
              label={`${enabledCount} enabled`}
              size="small"
              sx={{
                bgcolor: enabledCount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: enabledCount > 0 ? '#10b981' : '#ef4444',
                fontWeight: 700,
                border: 'none',
              }}
            />
          </Box>
        </Box>
        <Divider sx={{ my: 2, borderColor: '#f1f5f9' }} />

        <Stack spacing={3}>
          {/* Enabled Payment Methods */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39', mb: 1.5 }}>
              Payment Methods
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
              {PAYMENT_METHOD_OPTIONS.map((method) => {
                const isChecked = paymentSettings.enabledMethods.includes(method.id);
                return (
                  <Box
                    key={method.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.25,
                      px: 1.75,
                      borderRadius: '8px',
                      border: isChecked ? '1px solid #cbd5e1' : '1px solid #edf2f7',
                      bgcolor: isChecked ? 'rgba(11, 29, 57, 0.02)' : '#ffffff',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: isChecked ? 'rgba(11, 29, 57, 0.04)' : '#f8fafc',
                        borderColor: '#cbd5e1',
                      },
                    }}
                    onClick={() => handlePaymentMethodToggle(method.id)}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isChecked}
                          onChange={() => handlePaymentMethodToggle(method.id)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            color: '#94a3b8',
                            '&.Mui-checked': {
                              color: '#0b1d39',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0b1d39', ml: 0.5 }}>
                          {method.icon} {method.label}
                        </Typography>
                      }
                      sx={{ m: 0, width: '100%' }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#f1f5f9' }} />

          {/* Custom Payment Methods */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39', mb: 1.25 }}>
              Custom Payment Methods
            </Typography>
            {paymentSettings.customMethods.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {paymentSettings.customMethods.map((method) => (
                  <Chip
                    key={method.id}
                    label={method.label}
                    onDelete={() => handleRemoveCustomMethod(method.id)}
                    deleteIcon={<DeleteIcon fontSize="small" />}
                    sx={{
                      bgcolor: '#f1f5f9',
                      color: '#0b1d39',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      '&:hover': { bgcolor: '#e2e8f0' },
                    }}
                  />
                ))}
              </Box>
            )}
            {!showCustomInput ? (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                size="small"
                onClick={() => setShowCustomInput(true)}
                sx={{
                  borderRadius: '8px',
                  borderColor: '#cbd5e1',
                  color: '#0b1d39',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 2,
                  '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                }}
              >
                Add Custom Method
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, maxWidth: 500 }}>
                <TextField
                  size="small"
                  placeholder="Enter payment method name"
                  value={customMethod}
                  onChange={(e) => setCustomMethod(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      handleAddCustomMethod();
                    }
                  }}
                  autoFocus
                  sx={{
                    flex: 1,
                    bgcolor: '#ffffff',
                    '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                  }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAddCustomMethod}
                  disabled={!customMethod.trim()}
                  sx={{
                    bgcolor: '#0b1d39',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 2,
                    '&:hover': { bgcolor: '#162b4d' },
                  }}
                >
                  Add
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomMethod('');
                  }}
                  sx={{
                    borderRadius: '8px',
                    borderColor: '#cbd5e1',
                    color: '#64748b',
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Box>

          <Divider sx={{ borderColor: '#f1f5f9' }} />

          {/* Additional Options */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39', mb: 1.5 }}>
              Payment Options
            </Typography>
            <Stack spacing={1.25}>
              <Box
                sx={{
                  p: 1.5,
                  px: 1.75,
                  borderRadius: '8px',
                  border: '1px solid #edf2f7',
                  bgcolor: paymentSettings.allowMultplePayment ? 'rgba(11, 29, 57, 0.02)' : '#ffffff',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
                }}
                onClick={handleMultiplePaymentToggle}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={paymentSettings.allowMultplePayment}
                      onChange={handleMultiplePaymentToggle}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        color: '#94a3b8',
                        '&.Mui-checked': { color: '#0b1d39' },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ ml: 0.5 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#0b1d39' }}>
                        Allow Multiple Payment Methods in Single Transaction
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Accept split tender combinations on a single customer transaction
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%' }}
                />
              </Box>

              <Box
                sx={{
                  p: 1.5,
                  px: 1.75,
                  borderRadius: '8px',
                  border: '1px solid #edf2f7',
                  bgcolor: showDecodedPrices ? 'rgba(11, 29, 57, 0.02)' : '#ffffff',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
                }}
                onClick={() => setShowDecodedPrices(!showDecodedPrices)}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showDecodedPrices}
                      onChange={handleDecodedPricesToggle}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        color: '#94a3b8',
                        '&.Mui-checked': { color: '#0b1d39' },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ ml: 0.5 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#0b1d39' }}>
                        Show Encoded CP and SP on Checkout
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Displays cost price codes alongside selling prices for inventory auditing
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%' }}
                />
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default PaymentSettingsPanel;
