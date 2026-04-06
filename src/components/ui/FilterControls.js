import React from 'react';
import Button from './Button';
import { cn } from './cn';

export function FilterChip({ active = false, className = '', ...props }) {
  return (
    <Button
      variant={active ? 'subtle' : 'secondary'}
      size="sm"
      className={cn(
        'rounded-full !px-3 !py-1.5 text-xs shadow-none',
        active
          ? 'border-primary/45 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
          : 'border-ink/10 bg-white/85 text-ink/70 hover:border-primary/45 hover:text-primary',
        className
      )}
      {...props}
    />
  );
}

export function FilterToggle({ active = false, className = '', ...props }) {
  return (
    <Button
      variant={active ? 'subtle' : 'secondary'}
      size="sm"
      className={cn(
        'h-auto min-h-[44px] justify-start rounded-xl px-3 py-2 text-left text-sm shadow-none',
        active
          ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
          : 'border-ink/10 bg-white text-ink/75 hover:border-primary/35 hover:text-primary',
        className
      )}
      {...props}
    />
  );
}

export function PaginationButton({ active = false, className = '', ...props }) {
  return (
    <Button
      variant={active ? 'primary' : 'secondary'}
      size="sm"
      className={cn(
        'h-10 w-10 rounded-full p-0',
        active ? 'shadow-sm' : 'shadow-none',
        className
      )}
      {...props}
    />
  );
}
