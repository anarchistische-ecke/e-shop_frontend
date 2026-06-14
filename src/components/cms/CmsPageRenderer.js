import React from 'react';
import Seo from '../Seo';
import { Card } from '../ui';
import { getCmsBlockComponent } from './blockRegistry';
import { getBlockKey, getCmsLayoutVariant } from './cmsBlockShared';
import { useCmsSiteSettings } from '../../contexts/CmsContentContext';
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildJsonLdGraph,
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd
} from '../../seo/schema';

function CmsPageRenderer({ page }) {
  const { siteSettings } = useCmsSiteSettings();
  const sections = Array.isArray(page?.sections) ? page.sections : [];
  const canonicalPath = page?.path || '/';
  const shareImage = page?.seoImage?.url || siteSettings?.defaultOgImage?.url || '';
  const isHomeTemplate = page?.template === 'home' || page?.slug === 'home' || page?.path === '/';
  const pageTitle = page?.seoTitle || page?.title || '';
  const pageDescription = page?.seoDescription || page?.summary || '';
  const breadcrumbs = buildBreadcrumbJsonLd(
    isHomeTemplate
      ? []
      : [
          { name: 'Главная', path: '/' },
          { name: page?.title || pageTitle || 'Страница', path: canonicalPath }
        ]
  );
  const jsonLd = buildJsonLdGraph([
    isHomeTemplate ? buildOrganizationJsonLd({ siteSettings }) : null,
    isHomeTemplate ? buildWebSiteJsonLd({ siteSettings }) : null,
    buildWebPageJsonLd({
      title: pageTitle,
      description: pageDescription,
      path: canonicalPath,
      image: shareImage,
      breadcrumbs,
      siteSettings
    }),
    breadcrumbs,
    buildFaqPageJsonLd(page)
  ]);

  return (
    <>
      <Seo
        title={pageTitle}
        description={pageDescription}
        canonicalPath={canonicalPath}
        image={shareImage}
        imageAlt={pageTitle}
        jsonLd={jsonLd}
      />

      <section className={isHomeTemplate ? 'py-6 sm:py-8' : 'py-10 sm:py-12'}>
        <div className={`container mx-auto px-4 ${isHomeTemplate ? 'max-w-6xl' : 'max-w-5xl'}`}>
          <div className={isHomeTemplate ? 'space-y-6 sm:space-y-8' : 'space-y-5 sm:space-y-6'}>
            {sections.length > 0 ? (
              sections.map((section, index) => {
                const BlockComponent = getCmsBlockComponent(section.sectionType);
                const layoutVariant = getCmsLayoutVariant(section.layoutVariant);
                return (
                  <div
                    key={getBlockKey(section, index)}
                    className={layoutVariant === 'full' ? 'relative left-1/2 w-screen -translate-x-1/2 px-4 sm:px-6' : ''}
                  >
                    <BlockComponent
                      page={page}
                      section={section}
                      index={index}
                    />
                  </div>
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
