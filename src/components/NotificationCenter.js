import React from 'react';
import { Toast } from './ui';

function NotificationCenter({ notifications = [], onDismiss }) {
  if (!notifications.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[120] flex flex-col items-end gap-3">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto w-full max-w-sm">
          <Toast
            notification={notification}
            onDismiss={() => onDismiss(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}

export default NotificationCenter;
