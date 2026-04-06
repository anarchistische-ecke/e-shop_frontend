import React from 'react';
import NotificationBanner from './NotificationBanner';

function NotificationCenter({ notifications = [], onDismiss }) {
  if (!notifications.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[120] flex flex-col items-end gap-3">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto w-full max-w-sm">
          <NotificationBanner
            notification={notification}
            onDismiss={() => onDismiss(notification.id)}
            className="shadow-[0_18px_44px_rgba(43,39,34,0.14)]"
          />
        </div>
      ))}
    </div>
  );
}

export default NotificationCenter;
