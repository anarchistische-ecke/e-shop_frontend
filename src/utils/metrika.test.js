// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildEcommerceProduct,
  sanitizeAnalyticsParams,
  trackProductList
} from './metrika';

describe('metrika analytics helpers', () => {
  afterEach(() => {
    delete window.dataLayer;
    delete window.__cozyhomeMetrikaWarningShown;
  });

  it('drops contact and credential-like values but keeps marketing dimensions', () => {
    const payload = sanitizeAnalyticsParams({
      route_id: 'product',
      list_name: 'catalog_results',
      customer_name: 'Jane Customer',
      receiptEmail: 'buyer@example.test',
      phone: '+79990000000',
      public_token: 'abc',
      nested: {
        utm_source: 'direct',
        address: 'private'
      }
    });

    expect(payload).toEqual({
      route_id: 'product',
      list_name: 'catalog_results',
      nested: {
        utm_source: 'direct'
      }
    });
  });

  it('builds ecommerce product fields without customer PII', () => {
    const product = buildEcommerceProduct(
      {
        id: 'product-1',
        name: 'Комплект сатин',
        brand: { name: 'Cozyhome' },
        category: { name: 'Постельное белье' },
        selectedVariant: { id: 'variant-1', name: 'Евро', price: '3990.00' }
      },
      {
        quantity: 2,
        listName: 'catalog_results',
        position: 3
      }
    );

    expect(product).toMatchObject({
      id: 'product-1',
      name: 'Комплект сатин',
      brand: 'Cozyhome',
      category: 'Постельное белье',
      variant: 'Евро',
      price: 3990,
      quantity: 2,
      list: 'catalog_results',
      position: 3
    });
  });

  it('pushes product impressions into dataLayer', () => {
    trackProductList(
      [
        { id: 'p1', name: 'Product 1', price: 1000 },
        { id: 'p2', name: 'Product 2', price: 2000 }
      ],
      { listName: 'home_featured', pageType: 'home' }
    );

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer[0]).toEqual({
      ecommerce: {
        currencyCode: 'RUB',
        impressions: [
          expect.objectContaining({ id: 'p1', name: 'Product 1', list: 'home_featured', position: 1 }),
          expect.objectContaining({ id: 'p2', name: 'Product 2', list: 'home_featured', position: 2 })
        ]
      }
    });
  });
});
