import React from 'react';
import { cn } from './cn';

const Input = React.forwardRef(function Input(
  { invalid = false, className = '', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn('ui-input', invalid && 'ui-input--invalid', className)}
      {...props}
    />
  );
});

export default Input;
