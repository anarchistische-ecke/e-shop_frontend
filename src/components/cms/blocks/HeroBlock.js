import React from 'react';
import { Card } from '../../ui';
import {
  CmsRichText,
  CmsSectionActions,
  getSurfaceToneClass,
} from '../cmsBlockShared';
import CmsImage from '../CmsImage';

function HeroHighlights({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <Card
          key={`${item.title || item.label || 'hero-item'}-${index}`}
          variant="quiet"
          padding="sm"
          className="rounded-[22px] border border-white/75 bg-white/75"
        >
          {item.label ? (
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              {item.label}
            </p>
          ) : null}
          {item.title ? <p className="mt-1 text-base font-semibold text-ink">{item.title}</p> : null}
          {item.description ? <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p> : null}
        </Card>
      ))}
    </div>
  );
}

function HeroMedia({ section, page, priority = false }) {
  const hasMedia = section.image || section.imageUrl || section.mobileImage || section.mobileImageUrl;

  if (!hasMedia) {
    return null;
  }

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/55 shadow-[0_20px_42px_rgba(43,39,34,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/32 via-transparent to-white/70" />
        <div className="relative aspect-[16/10] sm:aspect-[1.05/1]">
          <CmsImage
            media={section.image || section.imageUrl}
            mobileMedia={section.mobileImage || section.mobileImageUrl}
            alt={section.title || page.title}
            frameClassName="absolute inset-0"
            sizes="(min-width: 1024px) 24rem, (min-width: 640px) 42vw, 92vw"
            priority={priority}
            preserveAspectRatio={false}
            placeholderLabel="Добавьте изображение для этого hero-блока"
          />
        </div>
      </div>
    </div>
  );
}

function HeroBlock({ page, section, index = 0 }) {
  const accent = section.accent ? <span className="text-primary">{section.accent}</span> : null;

  return (
    <section
      id={section.anchorId || undefined}
      data-testid={page?.template === 'home' && index === 0 ? 'home-hero' : undefined}
      className={`overflow-hidden rounded-[2rem] px-6 py-7 sm:px-8 sm:py-9 ${getSurfaceToneClass(section.styleVariant)}`}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,24rem)] lg:items-center">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              {section.eyebrow || page.navLabel || page.title}
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-[3.2rem] lg:leading-[0.95]">
              {section.title || page.title} {accent}
            </h1>
            <CmsRichText html={section.body} className="max-w-2xl text-base" />
          </div>

          <CmsSectionActions section={section} className="pt-1" />
          <HeroHighlights items={section.items || []} />
        </div>

        <HeroMedia section={section} page={page} priority={index === 0} />
      </div>
    </section>
  );
}

export default HeroBlock;
