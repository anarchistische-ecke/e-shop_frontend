import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from './ui';
import { TRUST_LINKS_BY_ID } from '../data/trustLinks';
import { ArrowRightIcon, ShieldIcon, TruckIcon } from './header/icons';

const serviceIcons = { delivery: TruckIcon, payment: ShieldIcon };

function TrustLinksPanel({
  title = 'Почему нам доверяют',
  description = '',
  linkIds = [],
  compact = false,
  className = '',
  onNavigate
}) {
  const links = useMemo(
    () => linkIds.map((id) => TRUST_LINKS_BY_ID[id]).filter(Boolean),
    [linkIds]
  );

  if (links.length === 0) {
    return null;
  }

  const content = (
    <>
      <div>
        <p className="text-sm font-bold text-ink">{title}</p>
        {description ? (
          <p className={`mt-2 text-sm text-muted ${compact ? '' : 'max-w-xl'}`}>{description}</p>
        ) : null}
      </div>

      <div className="mt-2 divide-y divide-line">
        {links.map((item) => {
          const Icon = serviceIcons[item.id];
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={onNavigate}
              className="focus-ring-soft flex min-h-11 items-center gap-3 py-2 text-left hover:text-primary"
            >
              {Icon ? <Icon className="h-5 w-5 shrink-0 text-primary" /> : null}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{item.title}</span>
                {!compact ? <span className="mt-0.5 block text-xs text-muted">{item.description}</span> : null}
              </span>
              <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted" />
            </Link>
          );
        })}
      </div>
    </>
  );

  if (compact) {
    return <section className={className}>{content}</section>;
  }

  return (
    <Card padding="sm" className={className}>
      {content}
    </Card>
  );
}

export default TrustLinksPanel;
