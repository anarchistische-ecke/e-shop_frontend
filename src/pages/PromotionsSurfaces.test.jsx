import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { getActivePromotions, getCustomerOrders } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useProductDirectoryData } from '../features/product-list/data';
import AccountPage from './AccountPage';
import Home from './Home';

vi.mock('../api', () => ({
  getActivePromotions: vi.fn(),
  getCmsPage: vi.fn(() => Promise.reject(Object.assign(new Error('Not found'), { status: 404 }))),
  getCustomerOrders: vi.fn(),
  isApiRequestError: vi.fn((error) => Boolean(error?.status)),
  updateCustomerProfile: vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../features/product-list/data', () => ({
  useProductDirectoryData: vi.fn(),
}));

vi.mock('../components/Seo', () => ({
  default: function SeoMock() {
    return null;
  },
}));

vi.mock('../components/cms/CmsManagedPage', () => ({
  default: function CmsManagedPageMock({ fallback }) {
    return fallback;
  },
}));

vi.mock('../components/common/ProductCard', () => ({
  default: function ProductCardMock({ product }) {
    return <article>{product?.name || 'Product'}</article>;
  },
}));

vi.mock('./ManagerAccountPage', () => ({
  default: function ManagerAccountPageMock() {
    return <div>Manager account</div>;
  },
}));

function renderWithRouter(ui, initialPath = '/') {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <MemoryRouter
        initialEntries={[initialPath]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        {ui}
      </MemoryRouter>
    );
  });

  return {
    container,
    async flush() {
      await act(async () => {
        await Promise.resolve();
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

const activePromotionsPayload = {
  promotions: [
    {
      id: 'promo-1',
      name: 'Весенняя акция',
      discountAmount: 50000,
      currency: 'RUB',
    },
  ],
  promoCodes: [
    {
      id: 'code-1',
      code: 'SPRING',
      discountPercent: 10,
    },
  ],
};

describe('active promotion surfaces', () => {
  let originalActEnvironment;

  beforeEach(() => {
    originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    getActivePromotions.mockResolvedValue(activePromotionsPayload);
    getCustomerOrders.mockResolvedValue([]);
    useProductDirectoryData.mockReturnValue({
      loading: false,
      categories: [{ id: 'popular', slug: 'popular', name: 'Популярное' }],
      products: [
        {
          id: 'prod-1',
          slug: 'linen-set',
          name: 'Комплект Linen',
          price: 4200,
          rating: 5,
          reviewCount: 12,
          category: 'popular',
          images: [{ url: 'https://cdn.example.test/linen.jpg', alt: 'Комплект Linen' }],
          variants: [{ id: 'variant-1', stock: 4, price: 4200 }],
        },
      ],
    });
    useAuth.mockReturnValue({
      isReady: true,
      isAuthenticated: true,
      tokenParsed: { email: 'buyer@example.test' },
      logout: vi.fn(),
      refreshProfile: vi.fn().mockResolvedValue({ email: 'buyer@example.test' }),
      hasRole: (role) => role === 'customer',
      hasStrongAuth: () => false,
    });
  });

  afterEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    vi.clearAllMocks();
  });

  it('renders active Directus promotions on the home page', async () => {
    const view = renderWithRouter(<Home />);

    await view.flush();

    expect(view.container.textContent).toContain('Весенняя акция');
    expect(view.container.textContent).toContain('500 RUB');
    expect(view.container.textContent).not.toContain('Соберите спальню за один заход');

    view.unmount();
  });

  it('renders active Directus promo codes in the customer account', async () => {
    const view = renderWithRouter(<AccountPage />, '/account#promocodes');

    await view.flush();

    expect(view.container.textContent).toContain('SPRING');
    expect(view.container.textContent).toContain('10%');

    view.unmount();
  });
});
