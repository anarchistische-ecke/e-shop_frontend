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

function findVariant(catalogProducts, variantId) {
  for (const product of catalogProducts) {
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

function serializeCartPricing(state, catalogProducts) {
  const items = state.items.map((item) => {
    const resolved = findVariant(catalogProducts, item.variantId);
    const unitPrice = Number(resolved?.variant?.price ?? item.unitPrice ?? 0);
    const originalUnitPrice = Number(resolved?.variant?.oldPrice ?? unitPrice);
    const quantity = Number(item.quantity) || 1;
    return {
      variantId: item.variantId,
      quantity,
      unitPrice,
      originalUnitPrice,
      lineTotal: unitPrice * quantity,
      originalLineTotal: originalUnitPrice * quantity,
      saleApplied: originalUnitPrice > unitPrice,
    };
  });
  const originalSubtotal = items.reduce((sum, item) => sum + item.originalLineTotal, 0);
  const saleSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const productSaleDiscount = Math.max(0, originalSubtotal - saleSubtotal);

  return {
    items,
    originalSubtotal,
    saleSubtotal,
    productSaleDiscount,
    cartDiscount: 0,
    promoCodeDiscount: 0,
    thresholdDiscount: 0,
    finalTotal: saleSubtotal,
    promoCode: '',
    promoCodeApplied: false,
    promoCodeStatus: null,
    appliedCartDiscountType: null,
    appliedCartDiscountLabel: null,
  };
}

function fulfillJson(route, payload, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

function createCustomerProfile(overrides = {}) {
  return {
    id: 'customer-e2e-1',
    firstName: 'Иван',
    lastName: 'Петров',
    email: 'buyer@example.com',
    phone: '+79990000000',
    birthDate: '',
    gender: 'female',
    marketingOptIn: false,
    ...overrides,
  };
}

function createCustomerOrder(overrides = {}) {
  return {
    ...clone(publicOrder),
    status: 'PAID',
    createdAt: '2026-06-20T10:00:00.000Z',
    updatedAt: '2026-06-20T10:15:00.000Z',
    statusUpdatedAt: '2026-06-20T10:15:00.000Z',
    paymentSummary: {
      status: 'COMPLETED',
      refundedAmount: { amount: 0, currency: 'RUB' },
      refundableAmount: { amount: 420000, currency: 'RUB' },
      refunds: [],
    },
    ...overrides,
  };
}

const cmsSiteSettings = {
  siteName: 'Постельное Белье-ЮГ',
  brandDescription: 'Домашний текстиль с понятной доставкой и оплатой.',
  supportPhone: '+7 961 466-88-33',
  supportEmail: 'postel-yug@yandex.ru',
  legalEntityShort: 'ИП Касьянова И.Л.',
  defaultSeoTitleSuffix: 'Постельное Белье-ЮГ',
  defaultSeoDescription: 'Домашний текстиль для уютного дома.',
};

const cmsHeaderNavigation = [
  {
    key: 'header_main',
    title: 'Полезное',
    placement: 'header',
    sort: 1,
    items: [
      { label: 'О бренде', url: '/about', sort: 1 },
      { label: 'Доставка', url: '/info/delivery', sort: 2 },
      { label: 'Оплата', url: '/info/payment', sort: 3 },
      { label: 'Документы', url: '/info/legal', sort: 4 },
    ],
  },
];

const cmsFooterNavigation = [
  {
    key: 'footer_catalog',
    title: 'Каталог',
    placement: 'footer',
    sort: 1,
    items: [
      { label: 'Все категории', url: '/catalog', sort: 1 },
      { label: 'Бестселлеры', url: '/category/popular', sort: 2 },
      { label: 'Новинки', url: '/category/new', sort: 3 },
    ],
  },
  {
    key: 'footer_service',
    title: 'Сервис',
    placement: 'footer',
    sort: 2,
    items: [
      { label: 'Доставка и самовывоз', url: '/info/delivery', sort: 1 },
      { label: 'Способы оплаты', url: '/info/payment', sort: 2 },
      { label: 'Реквизиты и документы', url: '/info/legal', sort: 3 },
    ],
  },
];

const cmsHomePage = {
  title: 'Домашний текстиль для уютного дома',
  slug: 'home',
  path: '/',
  template: 'home',
  summary: 'Редакционная главная витрина.',
  seoTitle: 'Домашний текстиль для уютного дома',
  seoDescription: 'Домашний текстиль для уютного дома с понятной доставкой и оплатой.',
  sections: [
    {
      anchorId: 'home-hero',
      sectionType: 'hero',
      sort: 1,
      eyebrow: 'Постельное Белье-ЮГ',
      title: 'Постель, которая остается свежей',
      accent: 'ночь за ночью',
      body: '<p>Выберите crisp-перкаль, гладкий сатин или мягкие комплекты для всей кровати.</p>',
      primaryCtaLabel: 'Смотреть бестселлеры',
      primaryCtaUrl: '/category/popular',
      secondaryCtaLabel: 'Найти свою ткань',
      secondaryCtaUrl: '/catalog?query=ткань',
      styleVariant: 'warm',
      items: [
        {
          label: 'Доставка',
          title: 'Доставка по согласованию',
          description: 'Менеджер рассчитает стоимость после заказа.',
          sort: 1,
        },
        {
          label: 'Оплата',
          title: 'Карта или СБП',
          description: 'Защищённая форма оплаты.',
          sort: 2,
        },
        {
          label: 'Материалы',
          title: 'Ткань и пошив под контролем',
          description: 'Собственное производство.',
          sort: 3,
        },
      ],
    },
    {
      anchorId: 'home-bestsellers',
      sectionType: 'product_reference_list',
      sort: 2,
      eyebrow: 'С чего начать',
      title: 'Бестселлеры, которые быстро объясняют выбор',
      body: '<p>Цена, материал и действие видны прямо на главной.</p>',
      primaryCtaLabel: 'Все бестселлеры',
      primaryCtaUrl: '/category/popular',
      layoutVariant: 'cards',
      items: [
        {
          title: 'Песочный сатиновый комплект',
          referenceKind: 'product_slug',
          referenceKey: 'satin-sand',
          sort: 1,
        },
        {
          title: 'Плед Облако',
          referenceKind: 'product_slug',
          referenceKey: 'throw-cloud',
          sort: 2,
        },
      ],
    },
    {
      anchorId: 'home-fabric-guide',
      sectionType: 'feature_list',
      sort: 3,
      eyebrow: 'Найти свою ткань',
      title: 'Выберите по ощущению, а не по названию ткани',
      body: '<p>Редакционные карточки можно заменить в CMS на реальные описания тканей.</p>',
      layoutVariant: 'full',
      items: [
        {
          label: 'Прохлада и свежесть',
          title: 'Перкаль',
          description: 'Матовая хлопковая ткань для прохладного ощущения.',
          sort: 1,
        },
        {
          label: 'Гладко и мягко',
          title: 'Сатин',
          description: 'Гладкая поверхность с мягким блеском.',
          sort: 2,
        },
        {
          label: 'Свободная фактура',
          title: 'Лен',
          description: 'Живая фактура и свободная посадка.',
          sort: 3,
        },
        {
          label: 'Готовый комплект',
          title: 'Готовый комплект',
          description: 'Быстрый путь к собранной кровати.',
          sort: 4,
        },
      ],
    },
    {
      anchorId: 'home-benefits',
      sectionType: 'feature_list',
      sort: 4,
      eyebrow: 'Покупать проще',
      title: 'Важные условия видны до оформления',
      styleVariant: 'sage',
      layoutVariant: 'full',
      items: [
        {
          title: 'Доставка после заказа',
          description: 'Стоимость и условия согласует менеджер.',
          sort: 1,
        },
        {
          title: 'Возврат без скрытых условий',
          description: 'Правила доступны в документах до покупки.',
          sort: 2,
        },
        {
          title: 'Контроль ткани и пошива',
          description: 'Собственное производство помогает держать качество.',
          sort: 3,
        },
        {
          title: 'Оплата картой или СБП',
          description: 'Безопасная оплата без сохранения данных карты.',
          sort: 4,
        },
      ],
    },
    {
      anchorId: 'home-materials',
      sectionType: 'feature_list',
      sort: 5,
      eyebrow: 'Материалы и сервис',
      title: 'Выбирайте по ткани, цвету и сценарию использования',
      body: '<p>Эти карточки являются заготовками для управляемого контента о материалах и сервисе.</p>',
      layoutVariant: 'cards',
      items: [
        {
          label: 'Сатин',
          title: 'Плотная гладкая ткань',
          description: 'Комплект быстро расправляется на кровати и держит спокойный вид.',
          sort: 1,
        },
        {
          label: 'Оплата',
          title: 'Условия видны заранее',
          description: 'Доставка и оплата описаны до оформления.',
          sort: 2,
        },
      ],
    },
    {
      anchorId: 'home-conversion-cta',
      sectionType: 'newsletter_cta',
      sort: 6,
      eyebrow: 'Готовы выбрать',
      title: 'Соберите кровать из проверенных комплектов',
      body: '<p>Начните с бестселлеров, добавьте плед или выберите ткань по ощущению.</p>',
      primaryCtaLabel: 'Смотреть бестселлеры',
      primaryCtaUrl: '/category/popular',
      secondaryCtaLabel: 'Собрать кровать',
      secondaryCtaUrl: '/catalog?query=комплект',
      styleVariant: 'accent',
      items: [
        {
          title: 'Выбор по ткани',
          sort: 1,
        },
        {
          title: 'Понятная доставка',
          sort: 2,
        },
      ],
    },
    {
      anchorId: 'home-categories',
      sectionType: 'category_reference_list',
      sort: 7,
      eyebrow: 'Каталог',
      title: 'Быстрый вход в популярные разделы',
      body: '<p>Browse-сценарий остается доступным после основных товарных и редакционных блоков.</p>',
      items: [
        {
          label: 'Выбор покупателей',
          title: 'Бестселлеры',
          referenceKind: 'category_slug',
          referenceKey: 'popular',
          sort: 1,
        },
        {
          label: 'Новинки',
          title: 'Новые поступления',
          referenceKind: 'category_slug',
          referenceKey: 'new',
          sort: 2,
        },
      ],
    },
  ],
};

const cmsCollections = {
  'home-bestsellers': {
    key: 'home-bestsellers',
    title: 'Подборка для главной',
    description: 'Товары и разделы, которые редактор закрепил в Directus.',
    primaryCtaLabel: 'Открыть каталог',
    primaryCtaUrl: '/catalog',
    items: products.slice(0, 2).map((product) => ({
      entityKind: 'product',
      entityKey: product.id,
      href: `/product/${product.id}/${product.slug}`,
      title: product.name,
      summary: product.description,
      price: product.price,
      image: product.images?.[0] || null,
      presentation: {
        marketingTitle: product.name,
        introBody: product.description,
        badgeText: product.category === 'new' ? 'Новинка' : 'Бестселлер',
      },
    })),
  },
};

async function mockStorefrontApi(page, overrides = {}) {
  const cartState = createCartState();
  const storefrontProducts = clone(overrides.products || products);
  const stats = {
    addItemRequests: 0,
    addItemPayloads: [],
    checkoutRequests: 0,
    checkoutPayloads: [],
    managerLinkRequests: 0,
    managerLinkPayloads: [],
    publicPayRequests: 0,
    publicPayPayloads: [],
    customerOrdersRequests: 0,
    customerRmaListRequests: 0,
    customerRmaCreateRequests: 0,
    customerRmaPayloads: [],
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
  let customerProfile = createCustomerProfile(overrides.customerProfile);
  const customerOrders = clone(overrides.customerOrders || [createCustomerOrder()]);
  const rmaRequestsByOrderId = new Map();
  customerOrders.forEach((order) => {
    rmaRequestsByOrderId.set(String(order.id), clone(overrides.rmaRequestsByOrderId?.[order.id] || []));
  });

  await page.addInitScript(() => {
    const initializationFlag = '__mock_storefront_api_initialized__';
    if (window.name && window.name.includes(initializationFlag)) {
      return;
    }
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.name = window.name ? `${window.name}|${initializationFlag}` : initializationFlag;
  });

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;
    const method = request.method();

    if (pathname === '/content/site-settings' && method === 'GET') {
      return fulfillJson(route, clone(cmsSiteSettings));
    }

    if (pathname === '/content/navigation' && method === 'GET') {
      const placement = url.searchParams.get('placement');
      if (placement === 'header') {
        return fulfillJson(route, clone(cmsHeaderNavigation));
      }
      if (placement === 'footer') {
        return fulfillJson(route, clone(cmsFooterNavigation));
      }
      return fulfillJson(route, clone([...cmsHeaderNavigation, ...cmsFooterNavigation]));
    }

    if (pathname === '/content/pages/home' && method === 'GET') {
      return fulfillJson(route, clone(cmsHomePage));
    }

    if (/^\/content\/pages\/[^/]+$/.test(pathname) && method === 'GET') {
      return fulfillJson(route, { message: 'CMS page not found' }, 404);
    }

    if (/^\/content\/collections\/[^/]+$/.test(pathname) && method === 'GET') {
      const key = pathname.split('/').pop();
      const collection = cmsCollections[key];
      if (!collection) {
        return fulfillJson(route, { message: 'CMS collection not found' }, 404);
      }
      return fulfillJson(route, clone(collection));
    }

    if (pathname === '/promotions/active' && method === 'GET') {
      return fulfillJson(route, { promotions: [], promoCodes: [] });
    }

    if (pathname === '/customers/me' && method === 'GET') {
      return fulfillJson(route, clone(customerProfile));
    }

    if (pathname === '/customers/me' && method === 'PUT') {
      const body = request.postDataJSON();
      customerProfile = {
        ...customerProfile,
        ...body,
      };
      return fulfillJson(route, clone(customerProfile));
    }

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
              root.innerHTML = '<div data-testid="mock-yookassa-widget" style="padding:16px;border:1px solid #d6cdc4;border-radius:16px;background:#fff;"><p style="margin:0 0 12px 0;font:600 14px sans-serif;">ТестКасса Защищённая форма</p><button type="button" data-testid="mock-yookassa-pay-button" style="min-height:44px;padding:10px 16px;border-radius:999px;background:#b65b4a;color:#fff;border:none;">Оплатить</button></div>';
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
      return fulfillJson(route, clone(storefrontProducts));
    }

    if (/^\/products\/[^/]+$/.test(pathname) && method === 'GET') {
      const productId = pathname.split('/').pop();
      const product = storefrontProducts.find((entry) => String(entry.id) === String(productId));
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

    if (pathname === `/carts/${cartState.id}/pricing` && method === 'GET') {
      return fulfillJson(route, serializeCartPricing(cartState, storefrontProducts));
    }

    if (pathname === `/carts/${cartState.id}/items` && method === 'POST') {
      stats.addItemRequests += 1;
      if (overrides.addItemDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, overrides.addItemDelayMs));
      }
      const body = request.postDataJSON();
      stats.addItemPayloads.push(body);
      const quantity = Number(body.quantity) || 1;
      const variantId = body.variantId;
      const resolved = findVariant(storefrontProducts, variantId);

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

    if (pathname === '/orders/me' && method === 'GET') {
      stats.customerOrdersRequests += 1;
      return fulfillJson(route, clone(customerOrders));
    }

    if (/^\/orders\/me\/[^/]+\/rma-requests$/.test(pathname)) {
      const orderId = decodeURIComponent(pathname.split('/')[3]);
      const existingRequests = rmaRequestsByOrderId.get(orderId) || [];

      if (method === 'GET') {
        stats.customerRmaListRequests += 1;
        return fulfillJson(route, { items: clone(existingRequests) });
      }

      if (method === 'POST') {
        stats.customerRmaCreateRequests += 1;
        const body = request.postDataJSON();
        stats.customerRmaPayloads.push(body);
        const nextRequest = {
          id: `rma-e2e-${existingRequests.length + 1}`,
          rmaNumber: `RMA-E2E-${String(existingRequests.length + 1).padStart(3, '0')}`,
          orderId,
          customerEmail: customerProfile.email,
          status: 'REQUESTED',
          reason: body.reason || '',
          desiredResolution: body.desiredResolution || '',
          managerComment: '',
          decidedBy: '',
          decidedAt: null,
          decisionVersion: 0,
          items: (Array.isArray(body.items) ? body.items : []).map((item, index) => ({
            id: `rma-e2e-${existingRequests.length + 1}-item-${index + 1}`,
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            createdAt: '2026-06-20T11:00:00.000Z',
            updatedAt: '2026-06-20T11:00:00.000Z',
          })),
          createdAt: '2026-06-20T11:00:00.000Z',
          updatedAt: '2026-06-20T11:00:00.000Z',
        };
        existingRequests.unshift(nextRequest);
        rmaRequestsByOrderId.set(orderId, existingRequests);
        return fulfillJson(route, clone(nextRequest), 201);
      }
    }

    if (pathname === '/orders/manager-link' && method === 'POST') {
      stats.managerLinkRequests += 1;
      stats.managerLinkPayloads.push(request.postDataJSON());
      cartState.items = [];
      return fulfillJson(route, {
        orderId: publicOrderPayload.id,
        publicToken: publicOrderPayload.publicToken,
        orderUrl: `http://localhost:3000/order/${publicOrderPayload.publicToken}`,
        emailSent: Boolean(request.postDataJSON().sendEmail),
      }, 201);
    }

    if (pathname === `/orders/public/${publicOrderPayload.publicToken}` && method === 'GET') {
      return fulfillJson(route, clone(publicOrderPayload));
    }

    if (pathname === `/orders/public/${publicOrderPayload.publicToken}/pay` && method === 'POST') {
      stats.publicPayRequests += 1;
      stats.publicPayPayloads.push(request.postDataJSON());
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
  createCustomerOrder,
  createCustomerProfile,
  mockStorefrontApi,
};
