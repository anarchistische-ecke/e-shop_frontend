import React from 'react';
import { resolveImageUrl } from '../../utils/product';

function normalizeVariants(variants = []) {
  if (!Array.isArray(variants)) {
    return [];
  }

  return variants
    .filter((variant) => variant?.url && Number(variant.width) > 0)
    .map((variant) => ({
      ...variant,
      url: resolveImageUrl(variant.url),
      width: Number(variant.width)
    }))
    .sort((left, right) => left.width - right.width);
}

function buildSrcSet(variants = []) {
  return normalizeVariants(variants)
    .map((variant) => `${variant.url} ${variant.width}w`)
    .join(', ');
}

function readFormatSources(media, format) {
  return media?.sources?.[format] || media?.sources?.[format.toLowerCase()] || [];
}

export function getResponsiveImageFallback(media, fallbackSrc = '') {
  const jpegSources = normalizeVariants(readFormatSources(media, 'jpeg'));
  const webpSources = normalizeVariants(readFormatSources(media, 'webp'));
  const preferred = jpegSources[jpegSources.length - 1] || webpSources[webpSources.length - 1];

  return resolveImageUrl(
    preferred?.url ||
      media?.url ||
      media?.originalUrl ||
      fallbackSrc ||
      ''
  );
}

function ResponsiveImage({
  media,
  mobileMedia = null,
  mobileMediaQuery = '(max-width: 767px)',
  src = '',
  alt = '',
  sizes = '100vw',
  className = '',
  loading,
  priority = false,
  fetchPriority,
  fetchpriority,
  decoding = 'async',
  width,
  height,
  draggable,
  ...rest
}) {
  const fallbackSrc = getResponsiveImageFallback(media, src);
  const resolvedAlt = alt || media?.alt || '';
  const resolvedLoading = loading || (priority ? 'eager' : 'lazy');
  const resolvedFetchPriority = fetchPriority || fetchpriority || (priority ? 'high' : 'auto');
  const avifSrcSet = buildSrcSet(readFormatSources(media, 'avif'));
  const webpSrcSet = buildSrcSet(readFormatSources(media, 'webp'));
  const jpegSrcSet = buildSrcSet(readFormatSources(media, 'jpeg'));
  const mobileAvifSrcSet = buildSrcSet(readFormatSources(mobileMedia, 'avif'));
  const mobileWebpSrcSet = buildSrcSet(readFormatSources(mobileMedia, 'webp'));
  const mobileJpegSrcSet =
    buildSrcSet(readFormatSources(mobileMedia, 'jpeg')) ||
    mobileMedia?.srcSet ||
    '';
  const resolvedWidth = width || media?.width || undefined;
  const resolvedHeight = height || media?.height || undefined;

  if (!fallbackSrc) {
    return null;
  }

  return (
    <picture>
      {mobileAvifSrcSet ? (
        <source media={mobileMediaQuery} type="image/avif" srcSet={mobileAvifSrcSet} sizes={sizes} />
      ) : null}
      {mobileWebpSrcSet ? (
        <source media={mobileMediaQuery} type="image/webp" srcSet={mobileWebpSrcSet} sizes={sizes} />
      ) : null}
      {mobileJpegSrcSet || mobileMedia?.src ? (
        <source
          media={mobileMediaQuery}
          srcSet={mobileJpegSrcSet || mobileMedia.src}
          sizes={mobileMedia?.sizes || sizes}
        />
      ) : null}
      {avifSrcSet ? <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} /> : null}
      {webpSrcSet ? <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} /> : null}
      <img
        src={fallbackSrc}
        srcSet={jpegSrcSet || undefined}
        sizes={jpegSrcSet ? sizes : undefined}
        alt={resolvedAlt}
        width={resolvedWidth}
        height={resolvedHeight}
        loading={resolvedLoading}
        fetchpriority={resolvedFetchPriority}
        decoding={decoding}
        draggable={draggable}
        className={className}
        {...rest}
      />
    </picture>
  );
}

export default ResponsiveImage;
