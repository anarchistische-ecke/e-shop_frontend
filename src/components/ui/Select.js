import React from 'react';
import { cn } from './cn';

const Select = React.forwardRef(function Select(
  { invalid = false, className = '', children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn('ui-select', invalid && 'ui-select--invalid', className)}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;
