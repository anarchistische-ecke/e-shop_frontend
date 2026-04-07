import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from './ui';
import { TRUST_LINKS_BY_ID } from '../data/trustLinks';

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
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{title}</p>
        {description ? (
          <p className={`mt-2 text-sm text-muted ${compact ? '' : 'max-w-xl'}`}>{description}</p>
        ) : null}
      </div>

      <div className={`grid gap-2 ${compact ? 'mt-3' : 'mt-4'}`}>
        {links.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            onClick={onNavigate}
            className="grid min-h-[44px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-left transition hover:border-primary/30 hover:bg-primary/5"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">{item.title}</span>
              <span className="mt-1 block text-xs text-muted">{item.description}</span>
            </span>
            <span className="text-primary" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
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
