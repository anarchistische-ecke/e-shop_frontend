import React from 'react';
import { cn } from './cn';

const VARIANT_CLASS = {
  soft: 'ui-card--soft',
  quiet: 'ui-card--quiet',
  outline: 'ui-card--outline',
  tint: 'ui-card--tint'
};

const PADDING_CLASS = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 md:p-7'
};

function Card({
  as: Component = 'div',
  variant = 'soft',
  padding = 'md',
  interactive = false,
  className = '',
  ...props
}) {
  return (
    <Component
      className={cn(
        'ui-card',
        VARIANT_CLASS[variant] || VARIANT_CLASS.soft,
        PADDING_CLASS[padding] || PADDING_CLASS.md,
        interactive && 'ui-card--interactive',
        className
      )}
      {...props}
    />
  );
}

export default Card;
