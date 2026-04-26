import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui';
import { resolveImageUrl } from '../../utils/product';

const SURFACE_TONE_CLASS = {
  default: 'border border-ink/10 bg-white/88 shadow-[0_18px_36px_rgba(43,39,34,0.08)]',
  warm: 'border border-primary/12 bg-white/92 shadow-[0_18px_36px_rgba(43,39,34,0.1)]',
  sage: 'border border-[#d7e1dc] bg-white/92 shadow-[0_18px_36px_rgba(43,39,34,0.08)]',
  quiet: 'border border-ink/10 bg-[#f8f4ee] shadow-[0_16px_28px_rgba(43,39,34,0.07)]',
  legal: 'border border-ink/10 bg-white/90 shadow-[0_18px_36px_rgba(43,39,34,0.1)]',
};
const CMS_IMAGE_WIDTHS = [320, 480, 640, 768, 960, 1200, 1440];

export function isInternalUrl(url) {
  return typeof url === 'string' && url.startsWith('/');
}

export function getBlockKey(section, index) {
  return section.internalName || section.anchorId || `${section.sectionType || 'section'}-${index}`;
}

export function getSurfaceToneClass(styleVariant = 'default') {
  return SURFACE_TONE_CLASS[styleVariant] || SURFACE_TONE_CLASS.default;
}

function normalizePositiveNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? Math.round(numericValue) : null;
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isDirectusAssetUrl(url = '') {
  return /\/assets\/[^/?#]+/i.test(url);
}

export function normalizeCmsMedia(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const url = resolveImageUrl(value);
    return url
      ? {
          id: '',
          url,
          width: null,
          height: null,
          alt: '',
          type: '',
        }
      : null;
  }

  if (typeof value !== 'object') {
    return null;
  }

  const url = resolveImageUrl(
    value.url ||
      value.src ||
      value.imageUrl ||
      value.image ||
      value.path ||
      value.filename_download ||
      value.filename_disk ||
      ''
  );

  if (!url) {
    return null;
  }

  return {
    id: hasText(value.id) ? value.id.trim() : '',
    url,
    width: normalizePositiveNumber(value.width),
    height: normalizePositiveNumber(value.height),
    alt: hasText(value.alt) ? value.alt.trim() : '',
    type: hasText(value.type) ? value.type.trim() : '',
  };
}

export function resolveMediaUrl(value) {
  return normalizeCmsMedia(value)?.url || '';
}

export function getCmsMediaAlt(media, fallback = '') {
  const normalizedMedia = normalizeCmsMedia(media);
  if (hasText(normalizedMedia?.alt)) {
    return normalizedMedia.alt;
  }

  return hasText(fallback) ? fallback.trim() : '';
}

export function buildCmsAssetUrl(url, { width, quality = 82 } = {}) {
  const resolvedUrl = resolveImageUrl(url);
  if (!resolvedUrl || !isDirectusAssetUrl(resolvedUrl) || !normalizePositiveNumber(width)) {
    return resolvedUrl;
  }

  try {
    const assetUrl = new URL(
      resolvedUrl,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );
    assetUrl.searchParams.set('width', String(normalizePositiveNumber(width)));
    assetUrl.searchParams.set('quality', String(quality));
    return assetUrl.toString();
  } catch (error) {
    return resolvedUrl;
  }
}

export function buildCmsMediaSources(media, { sizes = '100vw', maxWidth = 1440 } = {}) {
  const normalizedMedia = normalizeCmsMedia(media);

  if (!normalizedMedia?.url) {
    return null;
  }

  if (!isDirectusAssetUrl(normalizedMedia.url) || !normalizedMedia.width) {
    return {
      ...normalizedMedia,
      src: normalizedMedia.url,
      srcSet: '',
      sizes: '',
    };
  }

  const largestWidth = Math.min(normalizedMedia.width, maxWidth);
  const widths = [...new Set([
    ...CMS_IMAGE_WIDTHS.filter((candidate) => candidate < largestWidth),
    largestWidth,
  ])].sort((left, right) => left - right);

  return {
    ...normalizedMedia,
    src: buildCmsAssetUrl(normalizedMedia.url, { width: widths[widths.length - 1] }),
    srcSet: widths.map((candidate) => `${buildCmsAssetUrl(normalizedMedia.url, { width: candidate })} ${candidate}w`).join(', '),
    sizes,
  };
}

export function looksLikeHtml(value) {
  return typeof value === 'string' && /<\/?[a-z][\s\S]*>/i.test(value);
}

export function CmsRichText({ html, className = '' }) {
  if (!html) {
    return null;
  }

  if (!looksLikeHtml(html)) {
    return <div className={`cms-rich-text ${className}`.trim()}>{html}</div>;
  }

  return (
    <div
      className={`cms-rich-text ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function CmsAction({ label, url, variant = 'primary', className = '' }) {
  if (!label || !url) {
    return null;
  }

  if (isInternalUrl(url)) {
    return (
      <Button as={Link} to={url} variant={variant} className={className}>
        {label}
      </Button>
    );
  }

  return (
    <Button
      as="a"
      href={url}
      variant={variant}
      className={className}
      rel="noreferrer"
      target="_blank"
    >
      {label}
    </Button>
  );
}

export function CmsSectionActions({ section, className = '' }) {
  if (!section?.primaryCtaLabel && !section?.secondaryCtaLabel) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-3 ${className}`.trim()}>
      <CmsAction label={section.primaryCtaLabel} url={section.primaryCtaUrl} />
      <CmsAction
        label={section.secondaryCtaLabel}
        url={section.secondaryCtaUrl}
        variant="secondary"
      />
    </div>
  );
}

export function CmsSectionHeading({ eyebrow, title, description, align = 'left' }) {
  if (!eyebrow && !title && !description) {
    return null;
  }

  const alignmentClass = align === 'center' ? 'text-center items-center' : 'text-left items-start';

  return (
    <div className={`flex flex-col gap-3 ${alignmentClass}`.trim()}>
      {eyebrow ? (
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.28em] text-muted">
          {eyebrow}
        </p>
      ) : null}
      {title ? <h2 className="text-2xl font-semibold text-ink sm:text-[2rem]">{title}</h2> : null}
      <CmsRichText html={description} className={align === 'center' ? 'max-w-2xl' : ''} />
    </div>
  );
}
