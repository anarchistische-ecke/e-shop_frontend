import React from 'react';
import Seo from '../Seo';
import { Card } from '../ui';
import { getCmsBlockComponent } from './blockRegistry';
import { getBlockKey } from './cmsBlockShared';
import { useCmsSiteSettings } from '../../contexts/CmsContentContext';

function CmsPageRenderer({ page }) {
  const { siteSettings } = useCmsSiteSettings();
  const sections = Array.isArray(page?.sections) ? page.sections : [];
  const canonicalPath = page?.path || '/';
  const shareImage = page?.seoImage?.url || siteSettings?.defaultOgImage?.url || '';

  return (
    <>
      <Seo
        title={page?.seoTitle || page?.title || ''}
        description={page?.seoDescription || page?.summary || ''}
        canonicalPath={canonicalPath}
        image={shareImage}
      />

      <section className="py-10 sm:py-12">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="space-y-5 sm:space-y-6">
            {sections.length > 0 ? (
              sections.map((section, index) => {
                const BlockComponent = getCmsBlockComponent(section.sectionType);
                return (
                  <BlockComponent
                    key={getBlockKey(section, index)}
                    page={page}
                    section={section}
                    index={index}
                  />
                );
              })
            ) : (
              <Card padding="lg" className="space-y-4">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                  Контент
                </p>
                <h1 className="text-3xl font-semibold text-ink">{page?.title || 'Страница'}</h1>
                <p className="m-0 text-base leading-7 text-muted">
                  {page?.summary || 'Контент временно недоступен.'}
                </p>
              </Card>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default CmsPageRenderer;
