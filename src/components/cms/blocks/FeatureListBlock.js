import React from 'react';
import { Card } from '../../ui';
import {
  CmsAction,
  CmsRichText,
  CmsSectionActions,
  CmsSectionHeading,
  getCmsLayoutVariant,
  getSurfaceToneClass,
} from '../cmsBlockShared';

function getFeatureGridClass(layoutVariant) {
  const variant = getCmsLayoutVariant(layoutVariant);
  if (variant === 'full') {
    return 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4';
  }
  if (variant === 'rail') {
    return 'flex gap-4 overflow-x-auto pb-2 pr-4 snap-x snap-mandatory';
  }
  return 'grid gap-4 md:grid-cols-2 xl:grid-cols-3';
}

function getFeatureItemClass(layoutVariant) {
  return getCmsLayoutVariant(layoutVariant) === 'rail'
    ? 'w-[82vw] max-w-[20rem] flex-none snap-start sm:w-[18rem]'
    : '';
}

function FeatureListBlock({ section }) {
  const items = Array.isArray(section.items) ? section.items : [];

  return (
    <section id={section.anchorId || undefined} className="space-y-4">
      {(section.title || section.body || section.eyebrow) && (
        <Card
          padding="lg"
          className={`space-y-5 rounded-[28px] ${getSurfaceToneClass(section.styleVariant)}`}
        >
          <CmsSectionHeading
            eyebrow={section.eyebrow}
            title={section.title}
            description={section.body}
          />
          <CmsSectionActions section={section} />
        </Card>
      )}

      {items.length > 0 ? (
        <div className={getFeatureGridClass(section.layoutVariant)}>
          {items.map((item, index) => (
            <div
              key={`${item.title || item.label || 'feature-item'}-${index}`}
              className={getFeatureItemClass(section.layoutVariant)}
            >
              <Card
                padding="lg"
                className="h-full space-y-3 rounded-[24px] border border-ink/10 bg-white/88"
              >
                {item.label ? (
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    {item.label}
                  </p>
                ) : null}
                {item.title ? <h3 className="text-lg font-semibold text-ink">{item.title}</h3> : null}
                {item.description ? <p className="m-0 text-sm leading-6 text-muted">{item.description}</p> : null}
                {item.url ? (
                  <CmsAction
                    label="Подробнее"
                    url={item.url}
                    variant="secondary"
                  />
                ) : null}
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card padding="lg" className="rounded-[24px] border border-dashed border-ink/12 bg-white/76">
          <CmsRichText html={section.body} />
        </Card>
      )}
    </section>
  );
}

export default FeatureListBlock;
