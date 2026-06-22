import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ResponsiveImage from './ResponsiveImage';

function render(ui) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(ui);
  });

  return {
    container,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('ResponsiveImage', () => {
  let originalActEnvironment;

  beforeEach(() => {
    originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
  });

  it('renders modern format sources, fallback srcset, and priority attributes', () => {
    const view = render(
      <ResponsiveImage
        media={{
          url: 'https://img.example.com/media/product/w640.webp',
          originalUrl: 'https://storage.example.com/product.jpg',
          alt: 'Product',
          width: 1200,
          height: 800,
          sources: {
            avif: [{ url: 'https://img.example.com/media/product/w320.avif', width: 320, format: 'avif' }],
            webp: [{ url: 'https://img.example.com/media/product/w320.webp', width: 320, format: 'webp' }],
            jpeg: [{ url: 'https://img.example.com/media/product/w320.jpeg', width: 320, format: 'jpeg' }],
          },
        }}
        sizes="(min-width: 1024px) 24rem, 92vw"
        priority
        className="image"
      />
    );

    expect(view.container.querySelector('source[type="image/avif"]')?.getAttribute('srcset')).toContain('w320.avif 320w');
    expect(view.container.querySelector('source[type="image/webp"]')?.getAttribute('srcset')).toContain('w320.webp 320w');
    const img = view.container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://img.example.com/media/product/w320.jpeg');
    expect(img?.getAttribute('srcset')).toContain('w320.jpeg 320w');
    expect(img?.getAttribute('sizes')).toBe('(min-width: 1024px) 24rem, 92vw');
    expect(img?.getAttribute('loading')).toBe('eager');
    expect(img?.getAttribute('fetchpriority')).toBe('high');
    expect(img?.getAttribute('width')).toBe('1200');
    expect(img?.getAttribute('height')).toBe('800');

    view.unmount();
  });

  it('falls back to the original image when a responsive derivative fails', () => {
    const view = render(
      <ResponsiveImage
        media={{
          url: 'https://img.example.com/media/product/w640.webp',
          originalUrl: 'https://storage.example.com/product.jpg',
          alt: 'Product',
          sources: {
            avif: [{ url: 'https://img.example.com/media/product/w320.avif', width: 320, format: 'avif' }],
            webp: [{ url: 'https://img.example.com/media/product/w320.webp', width: 320, format: 'webp' }],
            jpeg: [{ url: 'https://img.example.com/media/product/w320.jpeg', width: 320, format: 'jpeg' }],
          },
        }}
      />
    );

    expect(view.container.querySelectorAll('source')).toHaveLength(2);
    const img = view.container.querySelector('img');

    act(() => {
      img.dispatchEvent(new Event('error', { bubbles: true }));
    });

    expect(view.container.querySelectorAll('source')).toHaveLength(0);
    expect(img.getAttribute('src')).toBe('https://storage.example.com/product.jpg');
    expect(img.getAttribute('srcset')).toBeNull();
    expect(img.getAttribute('sizes')).toBeNull();

    view.unmount();
  });

  it('forwards its ref to the rendered image', () => {
    const imageRef = React.createRef();
    const view = render(
      <ResponsiveImage
        ref={imageRef}
        media={{ originalUrl: 'https://storage.example.com/product.jpg' }}
      />
    );

    expect(imageRef.current).toBe(view.container.querySelector('img'));

    view.unmount();
  });
});
