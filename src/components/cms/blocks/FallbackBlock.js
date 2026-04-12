import React from 'react';
import { Card } from '../../ui';
import {
  CmsSectionActions,
  CmsSectionHeading,
  getSurfaceToneClass,
} from '../cmsBlockShared';

function FallbackBlock({ section }) {
  return (
    <Card
      as="section"
      id={section.anchorId || undefined}
      padding="lg"
      className={`space-y-5 rounded-[28px] ${getSurfaceToneClass(section.styleVariant)}`}
    >
      <CmsSectionHeading
        eyebrow={section.eyebrow}
        title={section.title}
        description={section.body}
      />

      {Array.isArray(section.items) && section.items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {section.items.map((item, index) => (
            <div
              key={`${item.title || item.label || 'fallback-item'}-${index}`}
              className="rounded-[22px] border border-ink/10 bg-white/78 p-4"
            >
              {item.title ? <p className="m-0 text-base font-semibold text-ink">{item.title}</p> : null}
              {item.description ? <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      <CmsSectionActions section={section} />
    </Card>
  );
}

export default FallbackBlock;
