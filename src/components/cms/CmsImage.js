import React from 'react';
import {
  buildCmsMediaSources,
  getCmsMediaAlt,
} from './cmsBlockShared';

function getAspectRatioStyle(media) {
  if (!media?.width || !media?.height) {
    return undefined;
  }

  return {
    aspectRatio: `${media.width} / ${media.height}`,
  };
}

function CmsImage({
  media,
  mobileMedia = null,
  alt = '',
  frameClassName = '',
  imageClassName = 'object-cover',
  sizes = '100vw',
  priority = false,
  placeholderLabel = 'Изображение появится после загрузки в CMS',
  preserveAspectRatio = true,
}) {
  const desktopSource = buildCmsMediaSources(media, { sizes });
  const mobileSource = buildCmsMediaSources(mobileMedia, { sizes });
  const fallbackSource = desktopSource || mobileSource;
  const resolvedAlt = getCmsMediaAlt(fallbackSource, alt);
  const aspectRatioStyle = preserveAspectRatio ? getAspectRatioStyle(fallbackSource) : undefined;

  return (
    <div
      className={`cms-media-frame ${frameClassName}`.trim()}
      style={aspectRatioStyle}
    >
      {fallbackSource?.src ? (
        <picture>
          {mobileSource?.src ? (
            <source
              media="(max-width: 767px)"
              srcSet={mobileSource.srcSet || mobileSource.src}
              sizes={mobileSource.sizes || sizes}
            />
          ) : null}
          <img
            src={desktopSource?.src || mobileSource.src}
            srcSet={desktopSource?.srcSet || undefined}
            sizes={desktopSource?.sizes || undefined}
            alt={resolvedAlt}
            width={fallbackSource.width || undefined}
            height={fallbackSource.height || undefined}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className={`absolute inset-0 h-full w-full ${imageClassName}`.trim()}
          />
        </picture>
      ) : (
        <div className="cms-media-placeholder absolute inset-0">
          <div className="cms-media-placeholder__glow" />
          <div className="cms-media-placeholder__content">
            <span className="cms-media-placeholder__label">{placeholderLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CmsImage;
