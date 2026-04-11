import { useState, useEffect } from 'react';
import settingsService from '../shared/api/settingsService';
import { getAdminAutoLogoutTime } from '../shared/utils/paymentSettings';

const STORAGE_KEYS = {
  user: 'posCurrentUser',
  expiry: 'posAdminElevationExpiry',
};

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [adminLogoutTimer, setAdminLogoutTimer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.user);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      if (user.originalRole) {
        const expiry = localStorage.getItem(STORAGE_KEYS.expiry);
        if (expiry) {
          const remaining = Math.floor((parseInt(expiry, 10) - Date.now()) / 1000);
          if (remaining > 0) {
            setAdminLogoutTimer(remaining);
          } else {
            handleAdminLogout();
          }
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let interval;
    if (adminLogoutTimer !== null && adminLogoutTimer > 0) {
      interval = setInterval(() => {
        setAdminLogoutTimer((prev) => prev - 1);
      }, 1000);
    } else if (adminLogoutTimer === 0) {
      handleAdminLogout();
    }

    if (adminLogoutTimer !== null && adminLogoutTimer % 5 === 0) {
      const expiry = localStorage.getItem(STORAGE_KEYS.expiry);
      if (expiry) {
        const remaining = Math.floor((parseInt(expiry, 10) - Date.now()) / 1000);
        if (Math.abs(remaining - adminLogoutTimer) > 2) {
          setAdminLogoutTimer(remaining > 0 ? remaining : 0);
        }
      }
    }

    return () => clearInterval(interval);
  }, [adminLogoutTimer]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.expiry);
  };

  const handleAdminLogin = async (password) => {
    try {
      const res = await settingsService.verifyAdmin(password);
      if (res.success) {
        const elevatedUser = {
          ...currentUser,
          originalRole: currentUser.role,
          role: 'admin',
        };
        setCurrentUser(elevatedUser);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(elevatedUser));

        const timeoutMinutes = getAdminAutoLogoutTime();
        const durationSeconds = timeoutMinutes * 60;
        const expiry = Date.now() + durationSeconds * 1000;

        localStorage.setItem(STORAGE_KEYS.expiry, expiry.toString());
        setAdminLogoutTimer(durationSeconds);
        return { success: true };
      }
      return { success: false, error: 'Invalid admin password' };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Invalid admin password' };
    }
  };

  const handleAdminLogout = () => {
    if (currentUser && currentUser.originalRole) {
      const restoredUser = {
        ...currentUser,
        role: currentUser.originalRole,
      };
      delete restoredUser.originalRole;

      setCurrentUser(restoredUser);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(restoredUser));
      localStorage.removeItem(STORAGE_KEYS.expiry);
      setAdminLogoutTimer(null);

      // Redirect to home/pos
      window.location.hash = '#/pos';
    }
  };

  return {
    currentUser,
    setCurrentUser,
    adminLogoutTimer,
    loading,
    handleLogin,
    handleLogout,
    handleAdminLogin,
    handleAdminLogout,
  };
};
