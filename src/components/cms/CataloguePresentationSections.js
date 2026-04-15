import React from 'react';
import { getCmsBlockComponent } from './blockRegistry';
import { getBlockKey } from './cmsBlockShared';

function renderSection(section, page, index, keyPrefix = 'catalogue') {
  if (!section) {
    return null;
  }

  const BlockComponent = getCmsBlockComponent(section.sectionType || 'rich_text');
  return (
    <BlockComponent
      key={`${keyPrefix}-${getBlockKey(section, index)}`}
      page={page}
      section={section}
      index={index}
    />
  );
}

export function CataloguePresentationHero({ hero, page, className = '' }) {
  if (!hero) {
    return null;
  }

  return (
    <div className={className}>
      {renderSection(hero, page, 0, 'catalogue-hero')}
    </div>
  );
}

export function CataloguePresentationBlocks({ blocks = [], page, className = '' }) {
  const safeBlocks = Array.isArray(blocks) ? blocks.filter(Boolean) : [];
  if (!safeBlocks.length) {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-6 sm:space-y-8">
        {safeBlocks.map((section, index) => renderSection(section, page, index + 1, 'catalogue-block'))}
      </div>
    </div>
  );
}

export default CataloguePresentationBlocks;
