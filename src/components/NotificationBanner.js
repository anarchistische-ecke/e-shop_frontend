import React from 'react';
import { getNotificationAppearance } from '../utils/notifications';

const NotificationBanner = React.forwardRef(function NotificationBanner(
  { notification, className = '', compact = false, onDismiss, ...props },
  ref
) {
  if (!notification) {
    return null;
  }

  const appearance = getNotificationAppearance(notification.type);
  const rootClassName = [
    'rounded-2xl border',
    compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
    appearance.container,
    className
  ]
    .filter(Boolean)
    .join(' ');

  const titleClassName = compact ? 'text-xs font-semibold' : 'text-sm font-semibold';
  const messageClassName = compact ? 'text-xs' : 'text-sm';
  const role = notification.type === 'error' ? 'alert' : 'status';
  const liveMode = notification.type === 'error' ? 'assertive' : 'polite';

  return (
    <div ref={ref} role={role} aria-live={liveMode} className={rootClassName} {...props}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {notification.title ? (
            <p className={titleClassName}>{notification.title}</p>
          ) : null}
          {notification.message ? (
            <p className={`${messageClassName}${notification.title ? ' mt-1' : ''}`}>
              {notification.message}
            </p>
          ) : null}
          {notification.action?.label && typeof notification.action.onClick === 'function' ? (
            <button
              type="button"
              className={`mt-2 inline-flex items-center font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                compact ? 'text-xs' : 'text-sm'
              } ${appearance.button}`}
              onClick={notification.action.onClick}
            >
              {notification.action.label}
            </button>
          ) : null}
        </div>
        {typeof onDismiss === 'function' ? (
          <button
            type="button"
            className={`shrink-0 rounded-full p-1 leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${appearance.button}`}
            onClick={onDismiss}
            aria-label="Закрыть уведомление"
          >
            x
          </button>
        ) : null}
      </div>
    </div>
  );
});

export default NotificationBanner;
