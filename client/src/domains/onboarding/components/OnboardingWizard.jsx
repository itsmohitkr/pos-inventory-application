import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Step,
  StepLabel,
  Stepper,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import { useOnboarding } from './useOnboarding';
import ShopProfileStep from './ShopProfileStep';
import AdminPasswordStep from './AdminPasswordStep';
import trovixLogo from '@/assets/trovix.png';

const STEPS = ['Shop Profile', 'Admin Password'];

export default function OnboardingWizard({ onComplete }) {
  const {
    activeStep,
    shopFields,
    passwordFields,
    canAdvance,
    canSubmit,
    submitting,
    error,
    handleShopChange,
    handlePasswordChange,
    handleNext,
    handleBack,
    handleSubmit,
  } = useOnboarding({ onComplete });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 520 }} elevation={4}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Box textAlign="center">
              <Box
                component="img"
                src={trovixLogo}
                alt="Trovix"
                sx={{ width: 72, height: 72, objectFit: 'contain', mb: 2, borderRadius: 2 }}
              />
              <Typography variant="h5" fontWeight={700}>
                Welcome to Trovix
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Let&apos;s get your shop set up in two quick steps.
              </Typography>
            </Box>

            <Stepper activeStep={activeStep} alternativeLabel>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === 0 ? (
              <ShopProfileStep fields={shopFields} onChange={handleShopChange} />
            ) : (
              <AdminPasswordStep fields={passwordFields} onChange={handlePasswordChange} />
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {activeStep > 0 && (
                <Button variant="outlined" onClick={handleBack} disabled={submitting}>
                  Back
                </Button>
              )}
              {activeStep === 0 ? (
                <Button variant="contained" onClick={handleNext} disabled={!canAdvance}>
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? 'Setting up…' : 'Finish Setup'}
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
