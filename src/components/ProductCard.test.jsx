import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ProductCard from './ProductCard';
import { WishlistContext } from '../contexts/WishlistContext';

const baseProduct = {
  id: 'product-1',
  slug: 'cassette',
  name: 'CASSETTE — коллекция премиальных подушек',
  stock: 8,
  variants: [
    {
      id: 'variant-1',
      name: '50 × 70',
      stock: 8,
      price: { amount: 450000 }
    }
  ],
  images: []
};

function renderCard(product) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <WishlistContext.Provider
          value={{ isWishlisted: () => false, toggle: vi.fn() }}
        >
          <ProductCard product={product} showAddToCart={false} />
        </WishlistContext.Provider>
      </MemoryRouter>
    );
  });

  return {
    container,
    unmount() {
      act(() => root.unmount());
      container.remove();
    }
  };
}

describe('ProductCard', () => {
  let originalActEnvironment;

  beforeEach(() => {
    originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
  });

  it('renders availability once even when the feed repeats it as product copy', () => {
    const view = renderCard({
      ...baseProduct,
      attributes: ['В наличии'],
      summary: 'В наличии'
    });

    const availabilityLabels = Array.from(view.container.querySelectorAll('p, span'))
      .filter((element) => element.textContent.trim() === 'В наличии');

    expect(availabilityLabels).toHaveLength(1);
    view.unmount();
  });

  it('does not reserve a blank thumbnail row for a product without alternate images', () => {
    const view = renderCard({ ...baseProduct, material: 'Хлопок' });

    expect(view.container.querySelector('[aria-label^="Показать изображение"]')).toBeNull();
    expect(view.container.textContent).toContain('Материал: Хлопок');
    view.unmount();
  });
});
