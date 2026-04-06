import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import NotificationCenter from '../components/NotificationCenter';
import { createNotification } from '../utils/notifications';

const DEFAULT_DURATIONS = {
  error: 7000,
  success: 4500,
  info: 5000,
  warning: 6000
};
const TOAST_LIMIT = 4;

const NotificationContext = createContext({
  notify: () => '',
  dismissNotification: () => {}
});

function createNotificationId() {
  return `notice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timersRef = useRef(new Map());

  const dismissNotification = useCallback((id) => {
    const timeoutId = timersRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timersRef.current.delete(id);
    }
    setNotifications((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const scheduleDismiss = useCallback(
    (id, duration) => {
      const existingTimer = timersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      const timeoutId = setTimeout(() => {
        dismissNotification(id);
      }, duration);
      timersRef.current.set(id, timeoutId);
    },
    [dismissNotification]
  );

  const notify = useCallback(
    (payload = {}) => {
      const notification = createNotification({
        ...payload,
        id: payload.id || createNotificationId()
      });

      setNotifications((prev) => {
        const next = [...prev.filter((entry) => entry.id !== notification.id), notification];
        return next.slice(-TOAST_LIMIT);
      });

      const duration =
        typeof payload.duration === 'number'
          ? payload.duration
          : DEFAULT_DURATIONS[notification.type] || DEFAULT_DURATIONS.info;

      if (duration > 0) {
        scheduleDismiss(notification.id, duration);
      }

      return notification.id;
    },
    [scheduleDismiss]
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timersRef.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      notify,
      dismissNotification
    }),
    [notify, dismissNotification]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationCenter notifications={notifications} onDismiss={dismissNotification} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
