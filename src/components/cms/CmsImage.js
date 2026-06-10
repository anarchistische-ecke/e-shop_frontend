import React from 'react';
import {
  buildCmsMediaSources,
  getCmsMediaAlt,
} from './cmsBlockShared';
import ResponsiveImage from '../media/ResponsiveImage';

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
  placeholderLabel = 'Изображение появится после загрузки в систему управления контентом',
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
        <ResponsiveImage
          media={desktopSource || mobileSource}
          mobileMedia={mobileSource}
          src={desktopSource?.src || mobileSource.src}
          sizes={desktopSource?.sizes || sizes}
          alt={resolvedAlt}
          width={fallbackSource.width || undefined}
          height={fallbackSource.height || undefined}
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : 'auto'}
          decoding="async"
          className={`absolute inset-0 h-full w-full ${imageClassName}`.trim()}
        />
      ) : (
        <div className="cms-media-placeholder absolute inset-0">
          <div className="cms-media-placeholder__content">
            <span className="cms-media-placeholder__label">{placeholderLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CmsImage;
