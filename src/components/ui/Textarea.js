import React from 'react';
import { cn } from './cn';

const Textarea = React.forwardRef(function Textarea(
  { invalid = false, className = '', ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn('ui-textarea', invalid && 'ui-textarea--invalid', className)}
      {...props}
    />
  );
});

export default Textarea;
