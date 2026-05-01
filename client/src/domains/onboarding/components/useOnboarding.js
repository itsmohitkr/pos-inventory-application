import { useState, useEffect } from 'react';
import authService from '@/shared/api/authService';
import settingsService from '@/shared/api/settingsService';

export function useOnboarding({ onComplete }) {
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [shopFields, setShopFields] = useState({
    shopName: '',
    address: '',
    phone: '',
    phone2: '',
    email: '',
    gst: '',
  });

  const [passwordFields, setPasswordFields] = useState({
    adminPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    settingsService.fetchSettings().then((res) => {
      const d = res.data;
      // Only pre-fill fields that the user hasn't typed in yet
      setShopFields((prev) => ({
        shopName: prev.shopName || d.posShopName || '',
        address: prev.address || d.shopAddress || '',
        phone: prev.phone || d.shopMobile || '',
        phone2: prev.phone2 || d.shopMobile2 || '',
        email: prev.email || d.shopEmail || '',
        gst: prev.gst || d.shopGST || '',
      }));
    }).catch(() => { });
  }, []);

  const handleShopChange = (field) => (e) => {
    setShopFields((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePasswordChange = (field) => (e) => {
    setPasswordFields((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const canAdvance = shopFields.shopName.trim().length > 0;

  const canSubmit =
    passwordFields.adminPassword.length >= 8 &&
    passwordFields.adminPassword === passwordFields.confirmPassword;

  const handleNext = () => {
    setError('');
    setActiveStep(1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep(0);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await authService.completeOnboarding({
        shopName: shopFields.shopName.trim(),
        address: shopFields.address.trim(),
        phone: shopFields.phone.trim(),
        phone2: shopFields.phone2.trim(),
        email: shopFields.email.trim(),
        gst: shopFields.gst.trim(),
        adminPassword: passwordFields.adminPassword,
      });
      onComplete();
    } catch (err) {
      setError(err?.response?.data?.message || 'Setup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
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
  };
}
