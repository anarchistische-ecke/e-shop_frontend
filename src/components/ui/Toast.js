import React from 'react';
import NotificationBanner from '../NotificationBanner';
import { cn } from './cn';

const Toast = React.forwardRef(function Toast(
  { notification, className = '', ...props },
  ref
) {
  return (
    <NotificationBanner
      ref={ref}
      notification={notification}
      className={cn('ui-toast', className)}
      {...props}
    />
  );
});

export default Toast;
