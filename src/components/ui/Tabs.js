import React, { useMemo, useRef } from 'react';
import { cn } from './cn';

function Tabs({
  items = [],
  value,
  onChange,
  ariaLabel,
  kind = 'tabs',
  idBase,
  className = '',
  listClassName = '',
  triggerClassName = '',
  fullWidth = false
}) {
  const tabRefs = useRef([]);
  const isTablist = kind === 'tabs';
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value)
  );
  const generatedIdBase = useMemo(
    () => idBase || `ui-tabs-${items.map((item) => item.value).join('-')}`,
    [idBase, items]
  );

  const focusItem = (index) => {
    const normalizedIndex = (index + items.length) % items.length;
    const nextItem = items[normalizedIndex];
    if (!nextItem) {
      return;
    }
    onChange(nextItem.value);
    window.requestAnimationFrame(() => {
      tabRefs.current[normalizedIndex]?.focus();
    });
  };

  const handleKeyDown = (event, index) => {
    if (items.length < 2) {
      return;
    }

    const isHorizontalKey = event.key === 'ArrowRight' || event.key === 'ArrowLeft';
    const isEdgeKey = event.key === 'Home' || event.key === 'End';

    if (!isHorizontalKey && !isEdgeKey) {
      return;
    }

    event.preventDefault();

    if (event.key === 'ArrowRight') {
      focusItem(index + 1);
      return;
    }

    if (event.key === 'ArrowLeft') {
      focusItem(index - 1);
      return;
    }

    if (event.key === 'Home') {
      focusItem(0);
      return;
    }

    focusItem(items.length - 1);
  };

  return (
    <div className={cn('ui-tabs', className)}>
      <div
        role={isTablist ? 'tablist' : 'group'}
        aria-label={ariaLabel}
        className={cn('ui-tabs__list', listClassName)}
      >
        {items.map((item, index) => {
          const isActive = item.value === value;
          const tabId = `${generatedIdBase}-tab-${item.value}`;
          const panelId = `${generatedIdBase}-panel-${item.value}`;
          const isFocusable = isActive || index === activeIndex;
          return (
            <button
              key={item.value}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role={isTablist ? 'tab' : undefined}
              aria-selected={isTablist ? isActive : undefined}
              aria-pressed={!isTablist ? isActive : undefined}
              aria-controls={isTablist ? panelId : undefined}
              id={isTablist ? tabId : undefined}
              tabIndex={isFocusable ? 0 : -1}
              className={cn(
                'ui-tabs__trigger',
                isActive && 'ui-tabs__trigger--active',
                fullWidth && 'ui-tabs__trigger--fill',
                triggerClassName
              )}
              onClick={() => onChange(item.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
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
