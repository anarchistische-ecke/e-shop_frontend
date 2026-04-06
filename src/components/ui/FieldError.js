import React from 'react';
import { cn } from './cn';

function FieldError({ id, children, className = '' }) {
  if (!children) {
    return null;
  }

  return (
    <p id={id} className={cn('ui-field-error', className)}>
      <span aria-hidden="true">⚠</span>
      <span>{children}</span>
    </p>
  );
}

export default FieldError;
