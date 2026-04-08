import React from 'react';
import { normalizeSearchText } from '../../utils/search';

function resolveGlyphKind(category) {
  const source = normalizeSearchText(
    `${category?.slug || category?.token || ''} ${category?.name || category?.label || ''} ${category?.description || ''}`
  );

  if (source.includes('new') || source.includes('нов')) return 'spark';
  if (source.includes('popular') || source.includes('best') || source.includes('лучш')) return 'star';
  if (source.includes('kid') || source.includes('дет') || source.includes('baby')) return 'moon';
  if (source.includes('bath') || source.includes('полот') || source.includes('ван')) return 'drop';
  if (source.includes('throw') || source.includes('плед') || source.includes('покрыв')) return 'wave';
  if (source.includes('sheet') || source.includes('bed') || source.includes('бель') || source.includes('сатин')) {
    return 'layers';
  }

  return 'grid';
}

function renderGlyph(kind) {
  switch (kind) {
    case 'spark':
      return (
        <>
          <path d="M12 4l1.6 3.7L17 9.2l-3.4 1.4L12 14.5l-1.6-3.9L7 9.2l3.4-1.5L12 4z" />
          <path d="M18.5 4.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9z" />
        </>
      );
    case 'star':
      return <path d="M12 4.6l2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7L12 4.6z" />;
    case 'moon':
      return <path d="M15.8 4.5A7.5 7.5 0 1019.5 16a7 7 0 01-3.7 1A7.5 7.5 0 0115.8 4.5z" />;
    case 'drop':
      return <path d="M12 4.8c3 4 4.4 6.5 4.4 8.4a4.4 4.4 0 11-8.8 0c0-1.9 1.4-4.4 4.4-8.4z" />;
    case 'wave':
      return (
        <>
          <path d="M4.5 9.5c1.4-1.3 2.8-1.3 4.2 0s2.8 1.3 4.2 0 2.8-1.3 4.2 0 2.8 1.3 4.2 0" />
          <path d="M4.5 14.5c1.4-1.3 2.8-1.3 4.2 0s2.8 1.3 4.2 0 2.8-1.3 4.2 0 2.8 1.3 4.2 0" />
        </>
      );
    case 'layers':
      return (
        <>
          <path d="M5 10.2L12 6l7 4.2-7 4.2-7-4.2z" />
          <path d="M7 13.8l5 3 5-3" />
        </>
      );
    default:
      return (
        <>
          <path d="M5 5h6v6H5z" />
          <path d="M13 5h6v6h-6z" />
          <path d="M5 13h6v6H5z" />
          <path d="M13 13h6v6h-6z" />
        </>
      );
  }
}

function CategoryGlyph({
  category,
  className = 'h-5 w-5',
  strokeWidth = 1.6
}) {
  const kind = resolveGlyphKind(category);

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {renderGlyph(kind)}
    </svg>
  );
}

export default CategoryGlyph;
