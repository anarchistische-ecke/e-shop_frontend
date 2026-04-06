const {
  brands,
  categories,
  paymentProvider,
  products,
  publicOrder,
} = require('../fixtures/storefront');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createCartState() {
  return {
    id: 'cart-e2e-1',
    nextItemId: 1,
    items: [],
  };
}

function findVariant(variantId) {
  for (const product of products) {
    for (const variant of product.variants || []) {
      if (variant.id === variantId) {
        return { product, variant };
      }
    }
  }
  return null;
}

function serializeCart(state) {
  return {
    id: state.id,
    items: state.items.map((item) => ({ ...item })),
  };
}

function fulfillJson(route, payload, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

async function mockStorefrontApi(page) {
  const cartState = createCartState();

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;
    const method = request.method();

    if (pathname === '/categories' && method === 'GET') {
      return fulfillJson(route, clone(categories));
    }

    if (pathname === '/brands' && method === 'GET') {
      return fulfillJson(route, clone(brands));
    }

    if (pathname === '/payments/public-config' && method === 'GET') {
      return fulfillJson(route, clone(paymentProvider));
    }

    if (pathname === '/products' && method === 'GET') {
      return fulfillJson(route, clone(products));
    }

    if (/^\/products\/[^/]+$/.test(pathname) && method === 'GET') {
      const productId = pathname.split('/').pop();
      const product = products.find((entry) => String(entry.id) === String(productId));
      if (!product) {
        return fulfillJson(route, { message: 'Product not found' }, 404);
      }
      return fulfillJson(route, clone(product));
    }

    if (pathname === '/carts' && method === 'POST') {
      return fulfillJson(route, { id: cartState.id });
    }

    if (pathname === `/carts/${cartState.id}` && method === 'GET') {
      return fulfillJson(route, serializeCart(cartState));
    }

    if (pathname === `/carts/${cartState.id}/items` && method === 'POST') {
      const body = request.postDataJSON();
      const quantity = Number(body.quantity) || 1;
      const variantId = body.variantId;
      const resolved = findVariant(variantId);

      if (!resolved) {
        return fulfillJson(route, { message: 'Variant not found' }, 404);
      }

      const existing = cartState.items.find((item) => item.variantId === variantId);
      if (existing) {
        existing.quantity += quantity;
        return fulfillJson(route, { ...existing });
      }

      const nextItem = {
        id: `cart-item-${cartState.nextItemId++}`,
        variantId,
        quantity,
        unitPrice: resolved.variant.price,
      };
      cartState.items.push(nextItem);
      return fulfillJson(route, { ...nextItem }, 201);
    }

    if (/^\/carts\/[^/]+\/items\/[^/]+$/.test(pathname) && method === 'PUT') {
      const itemId = pathname.split('/').pop();
      const body = request.postDataJSON();
      const item = cartState.items.find((entry) => entry.id === itemId);
      if (!item) {
        return fulfillJson(route, { message: 'Cart item not found' }, 404);
      }
      item.quantity = Number(body.quantity) || item.quantity;
      return fulfillJson(route, { ...item });
    }

    if (/^\/carts\/[^/]+\/items\/[^/]+$/.test(pathname) && method === 'DELETE') {
      const itemId = pathname.split('/').pop();
      cartState.items = cartState.items.filter((entry) => entry.id !== itemId);
      return route.fulfill({ status: 204, body: '' });
    }

    if (pathname === '/orders/checkout' && method === 'POST') {
      return fulfillJson(route, {
        orderId: publicOrder.id,
        publicToken: publicOrder.publicToken,
        confirmationUrl: 'https://payments.example.test/checkout',
      });
    }

    if (pathname === `/orders/public/${publicOrder.publicToken}` && method === 'GET') {
      return fulfillJson(route, clone(publicOrder));
    }

    if (pathname === `/orders/public/${publicOrder.publicToken}/pay` && method === 'POST') {
      return fulfillJson(route, {
        confirmationUrl: 'https://payments.example.test/retry',
      });
    }

    if (pathname === `/orders/public/${publicOrder.publicToken}/refresh-payment` && method === 'POST') {
      return fulfillJson(route, clone(publicOrder));
    }

    if (pathname === '/deliveries/yandex/offers' && method === 'POST') {
      return fulfillJson(route, {
        offers: [
          {
            offerId: 'offer-e2e-1',
            pricing: 0,
            pricingTotal: 0,
            intervalFrom: '2026-04-08T10:00:00.000Z',
            intervalTo: '2026-04-08T14:00:00.000Z',
          },
        ],
      });
    }

    if (pathname === '/deliveries/yandex/pickup-points' && method === 'POST') {
      return fulfillJson(route, {
        geoId: 'geo-e2e',
        points: [
          {
            id: 'pickup-e2e-1',
            name: 'ПВЗ Тестовый',
            address: 'Москва, Тестовая улица, 1',
            latitude: 55.75,
            longitude: 37.61,
          },
        ],
      });
    }

    return route.continue();
  });

  return { cartState };
}

module.exports = {
  mockStorefrontApi,
};
