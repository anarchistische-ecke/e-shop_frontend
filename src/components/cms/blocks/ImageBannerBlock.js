import React from 'react';
import { Card } from '../../ui';
import {
  CmsAction,
  CmsSectionActions,
  CmsSectionHeading,
  getSurfaceToneClass,
} from '../cmsBlockShared';
import CmsImage from '../CmsImage';

function BannerMedia({ section, items = [] }) {
  const primaryMedia = section.image || section.imageUrl || items[0]?.image || items[0]?.imageUrl;
  const mobileMedia = section.mobileImage || section.mobileImageUrl;

  if (primaryMedia || mobileMedia) {
    return (
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/65 shadow-[0_18px_38px_rgba(43,39,34,0.14)]">
        <CmsImage
          media={primaryMedia}
          mobileMedia={mobileMedia}
          alt={section.title || items[0]?.title || 'CMS banner'}
          frameClassName="aspect-[5/4]"
          sizes="(min-width: 1024px) 24rem, (min-width: 640px) 42vw, 92vw"
          preserveAspectRatio={false}
          placeholderLabel="Добавьте изображение для баннера"
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/75 bg-white/88 shadow-[0_18px_38px_rgba(43,39,34,0.12)]">
      <div className="aspect-[5/4]">
        <div className="absolute left-6 top-6 rounded-full border border-white/65 bg-white/55 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          CMS banner
        </div>
        <div className="absolute inset-x-6 bottom-6 space-y-2 rounded-[22px] border border-white/60 bg-white/65 px-5 py-4 backdrop-blur">
          <p className="m-0 text-sm font-semibold text-ink">
            Для этого блока можно подключить отдельное изображение позже
          </p>
          <p className="m-0 text-sm leading-6 text-muted">
            Пока что компонент рендерит редакторский текст и CTA без жёсткой зависимости от картинки.
          </p>
        </div>
      </div>
    </div>
  );
}

function ImageBannerCards({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <Card
          key={`${item.title || item.label || 'banner-item'}-${index}`}
          variant="quiet"
          padding="sm"
          className="rounded-[22px] border border-white/70 bg-white/72"
        >
          {item.label ? (
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              {item.label}
            </p>
          ) : null}
          {item.title ? <p className="mt-1 text-base font-semibold text-ink">{item.title}</p> : null}
          {item.description ? <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p> : null}
          {item.url ? (
            <div className="mt-3">
              <CmsAction label={item.label || 'Открыть'} url={item.url} variant="secondary" />
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function ImageBannerBlock({ section }) {
  const items = Array.isArray(section.items) ? section.items : [];

  return (
    <section
      id={section.anchorId || undefined}
      className={`overflow-hidden rounded-[2rem] px-6 py-7 sm:px-8 sm:py-9 ${getSurfaceToneClass(section.styleVariant)}`}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
        <div className="space-y-5">
          <CmsSectionHeading
            eyebrow={section.eyebrow}
            title={section.title}
            description={section.body}
          />
          <CmsSectionActions section={section} />
          <ImageBannerCards items={items} />
        </div>

        <BannerMedia section={section} items={items} />
      </div>
    </section>
  );
}

export default ImageBannerBlock;
