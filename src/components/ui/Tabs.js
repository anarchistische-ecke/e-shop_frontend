import React from 'react';
import { cn } from './cn';

function Tabs({
  items = [],
  value,
  onChange,
  ariaLabel,
  className = '',
  listClassName = '',
  triggerClassName = '',
  fullWidth = false
}) {
  return (
    <div className={cn('ui-tabs', className)}>
      <div role="tablist" aria-label={ariaLabel} className={cn('ui-tabs__list', listClassName)}>
        {items.map((item) => {
          const isActive = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn(
                'ui-tabs__trigger',
                isActive && 'ui-tabs__trigger--active',
                fullWidth && 'ui-tabs__trigger--fill',
                triggerClassName
              )}
              onClick={() => onChange(item.value)}
            >
              <span className="font-semibold">{item.label}</span>
              {item.caption ? (
                <span className="mt-0.5 block text-[11px] font-medium text-current/70">
                  {item.caption}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Tabs;
