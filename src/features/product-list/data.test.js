import { vi } from 'vitest';

vi.mock('../../api', () => ({
  getBrands: vi.fn(),
  getCategories: vi.fn(),
  getProducts: vi.fn()
}));

import { getBrands, getCategories, getProducts } from '../../api';
import {
  __resetProductDirectoryCacheForTests,
  loadProductDirectoryData
} from './data';

describe('product directory data', () => {
  beforeEach(() => {
    __resetProductDirectoryCacheForTests();
    vi.clearAllMocks();
  });

  it('reuses the shared directory request and cache across calls', async () => {
    getCategories.mockResolvedValue([{ id: 'cat-1', name: 'Постельное белье' }]);
    getBrands.mockResolvedValue([{ id: 'brand-1', name: 'Cozy Home' }]);
    getProducts.mockResolvedValue([
      { id: 'prod-1', name: 'Комплект сатин', isActive: true },
      { id: 'prod-2', name: 'Скрытый товар', isActive: false }
    ]);

    const [first, second] = await Promise.all([
      loadProductDirectoryData(),
      loadProductDirectoryData()
    ]);

    expect(getCategories).toHaveBeenCalledTimes(1);
    expect(getBrands).toHaveBeenCalledTimes(1);
    expect(getProducts).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(first.products).toEqual([
      { id: 'prod-1', name: 'Комплект сатин', isActive: true }
    ]);

    await loadProductDirectoryData();

    expect(getCategories).toHaveBeenCalledTimes(1);
    expect(getBrands).toHaveBeenCalledTimes(1);
    expect(getProducts).toHaveBeenCalledTimes(1);
  });

  it('can force-refresh the cached directory snapshot', async () => {
    getCategories
      .mockResolvedValueOnce([{ id: 'cat-1', name: 'Спальня' }])
      .mockResolvedValueOnce([{ id: 'cat-2', name: 'Ванная' }]);
    getBrands
      .mockResolvedValueOnce([{ id: 'brand-1', name: 'Luna' }])
      .mockResolvedValueOnce([{ id: 'brand-2', name: 'Nova' }]);
    getProducts
      .mockResolvedValueOnce([{ id: 'prod-1', name: 'Плед', isActive: true }])
      .mockResolvedValueOnce([{ id: 'prod-2', name: 'Полотенце', isActive: true }]);

    await loadProductDirectoryData();
    const refreshed = await loadProductDirectoryData({ force: true });

    expect(getCategories).toHaveBeenCalledTimes(2);
    expect(getBrands).toHaveBeenCalledTimes(2);
    expect(getProducts).toHaveBeenCalledTimes(2);
    expect(refreshed.categories).toEqual([{ id: 'cat-2', name: 'Ванная' }]);
    expect(refreshed.products).toEqual([
      { id: 'prod-2', name: 'Полотенце', isActive: true }
    ]);
  });
});
