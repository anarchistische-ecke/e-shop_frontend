import React from 'react';
import { Card } from '../../ui';
import {
  CmsSectionActions,
  CmsSectionHeading,
  getSurfaceToneClass,
} from '../cmsBlockShared';

function CtaSectionBlock({ section }) {
  const items = Array.isArray(section.items) ? section.items : [];

  return (
    <section id={section.anchorId || undefined}>
      <Card
        padding="lg"
        className={`overflow-hidden rounded-[32px] border border-primary/16 ${getSurfaceToneClass(section.styleVariant || 'warm')}`}
      >
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="relative z-10 space-y-5">
            <CmsSectionHeading
              eyebrow={section.eyebrow}
              title={section.title}
              description={section.body}
            />

            {items.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {items.map((item, index) => (
                  <span
                    key={`${item.title || item.label || 'cta-chip'}-${index}`}
                    className="rounded-full border border-ink/10 bg-white/72 px-3 py-1.5 text-sm text-ink/80"
                  >
                    {item.title || item.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative z-10 lg:justify-self-end">
            <CmsSectionActions section={section} className="pt-1 lg:flex-col lg:items-stretch" />
          </div>
        </div>
      </Card>
    </section>
  );
}

export default CtaSectionBlock;
