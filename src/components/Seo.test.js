import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import Seo from './Seo';

describe('Seo', () => {
  let container;
  let root;
  let originalHeadHtml;
  let originalTitle;
  let originalActEnvironment;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    originalHeadHtml = document.head.innerHTML;
    originalTitle = document.title;
    originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.head.innerHTML = originalHeadHtml;
    document.title = originalTitle;
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
  });

  it('writes canonical metadata and escapes JSON-LD payloads safely', () => {
    act(() => {
      root.render(
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
      );
    });

    expect(document.title).toBe('Тестовая карточка | Постельное Белье-ЮГ');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'http://localhost/home/product/prod-1/linen-soft'
    );
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'index,follow'
    );

    const jsonLd = document.getElementById('cozyhome-seo-jsonld');
    expect(jsonLd).not.toBeNull();
    expect(jsonLd.textContent).toContain('\\u003c/script\\u003e');
  });
});
