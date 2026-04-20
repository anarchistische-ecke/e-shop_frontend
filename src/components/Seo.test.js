// @vitest-environment node

import React from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import Seo from './Seo';

describe('Seo', () => {
  const originalSiteUrl = process.env.REACT_APP_SITE_URL;

  afterEach(() => {
    if (typeof originalSiteUrl === 'undefined') {
      delete process.env.REACT_APP_SITE_URL;
      return;
    }

    process.env.REACT_APP_SITE_URL = originalSiteUrl;
  });

  it('writes canonical metadata and escapes JSON-LD payloads safely', () => {
    process.env.REACT_APP_SITE_URL = 'http://localhost';
    const helmetContext = {};

    renderToString(
      <HelmetProvider context={helmetContext}>
        <Seo
          title="Тестовая карточка"
          description="Описание товара"
          canonicalPath="/product/prod-1/linen-soft"
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Комплект </script> Linen',
          }}
        />
      </HelmetProvider>
    );

    expect(helmetContext.helmet.title.toString()).toContain(
      'Тестовая карточка | Постельное Белье-ЮГ'
    );
    expect(helmetContext.helmet.link.toString()).toContain(
      'http://localhost/product/prod-1/linen-soft'
    );
    expect(helmetContext.helmet.meta.toString()).toContain(
      'index,follow'
    );
    expect(helmetContext.helmet.script.toString()).toContain('\\u003c/script\\u003e');
  });
});
