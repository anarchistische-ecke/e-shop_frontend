import React from 'react';
import { cn } from './cn';

const VARIANT_CLASS = {
  primary: 'ui-button--primary',
  secondary: 'ui-button--secondary',
  ghost: 'ui-button--ghost',
  subtle: 'ui-button--subtle'
};

const SIZE_CLASS = {
  sm: 'ui-button--sm',
  md: 'ui-button--md',
  lg: 'ui-button--lg',
  icon: 'ui-button--icon'
};

const Button = React.forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    block = false,
    className = '',
    type,
    ...props
  },
  ref
) {
  const resolvedType = Component === 'button' ? type || 'button' : undefined;

  return (
    <Component
      ref={ref}
      type={resolvedType}
      className={cn(
        'ui-button',
        VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
        SIZE_CLASS[size] || SIZE_CLASS.md,
        block && 'w-full',
        className
      )}
      {...props}
    />
  );
});

export default Button;
