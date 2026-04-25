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

async function mockStorefrontApi(page, overrides = {}) {
  const cartState = createCartState();
  const stats = {
    addItemRequests: 0,
    checkoutRequests: 0,
    checkoutPayloads: [],
  };
  const paymentProviderConfig = {
    ...clone(paymentProvider),
    ...(overrides.paymentProvider || {}),
  };
  const publicOrderPayload = clone(overrides.publicOrder || publicOrder);
  const checkoutResponse =
    overrides.checkoutResponse || {
      order: publicOrderPayload,
      payment: {
        paymentId: 'payment-e2e-checkout',
        confirmationType: 'REDIRECT',
        confirmationUrl: 'https://payments.example.test/checkout',
        confirmationToken: '',
      },
    };
  const payResponse =
    overrides.payResponse || {
      paymentId: 'payment-e2e-retry',
      confirmationType: 'REDIRECT',
      confirmationUrl: 'https://payments.example.test/retry',
      confirmationToken: '',
    };

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
      return fulfillJson(route, clone(paymentProviderConfig));
    }

    if (
      pathname === '/checkout-widget/v1/checkout-widget.js' &&
      url.hostname === 'yookassa.ru' &&
      method === 'GET'
    ) {
      return route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          window.YooMoneyCheckoutWidget = function YooMoneyCheckoutWidget(config) {
            this.render = function render(containerId) {
              var root = document.getElementById(containerId);
              if (!root) {
                throw new Error('Missing widget container');
              }
              root.innerHTML = '<div data-testid="mock-yookassa-widget" style="padding:16px;border:1px solid #d6cdc4;border-radius:16px;background:#fff;"><p style="margin:0 0 12px 0;font:600 14px sans-serif;">ТестКасса Secure Form</p><button type="button" data-testid="mock-yookassa-pay-button" style="min-height:44px;padding:10px 16px;border-radius:999px;background:#b65b4a;color:#fff;border:none;">Оплатить</button></div>';
              root.querySelector('[data-testid="mock-yookassa-pay-button"]').addEventListener('click', function() {
                window.location.assign(config.return_url);
              });
            };
            this.destroy = function destroy() {};
          };
        `,
      });
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
      stats.addItemRequests += 1;
      if (overrides.addItemDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, overrides.addItemDelayMs));
      }
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
      stats.checkoutRequests += 1;
      stats.checkoutPayloads.push(request.postDataJSON());
      return fulfillJson(route, clone(checkoutResponse));
    }

    if (pathname === `/orders/public/${publicOrderPayload.publicToken}` && method === 'GET') {
      return fulfillJson(route, clone(publicOrderPayload));
    }

    if (pathname === `/orders/public/${publicOrderPayload.publicToken}/pay` && method === 'POST') {
      return fulfillJson(route, clone(payResponse));
    }

    if (pathname === `/orders/public/${publicOrderPayload.publicToken}/refresh-payment` && method === 'POST') {
      return fulfillJson(route, clone(publicOrderPayload));
    }

    return route.continue();
  });

  return { cartState, stats };
}

module.exports = {
  mockStorefrontApi,
};
