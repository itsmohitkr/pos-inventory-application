import { useState, useEffect } from 'react';

/**
 * Tracks browser-reported network connectivity (`navigator.onLine` + the
 * `online`/`offline` window events). This reflects general network
 * reachability, not specifically Wi-Fi vs. Ethernet — Chromium doesn't
 * reliably expose connection *type* across platforms, so this is the
 * pragmatic signal for "is this machine connected to a network right now".
 */
const useOnlineStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export default useOnlineStatus;
