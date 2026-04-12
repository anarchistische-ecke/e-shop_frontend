import React from 'react';
import { Card } from '../../ui';
import {
  CmsRichText,
  CmsSectionActions,
  CmsSectionHeading,
  getSurfaceToneClass,
} from '../cmsBlockShared';

function RichTextBlock({ section }) {
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
        description={null}
      />
      <CmsRichText html={section.body} />
      <CmsSectionActions section={section} />
    </Card>
  );
}

export default RichTextBlock;
