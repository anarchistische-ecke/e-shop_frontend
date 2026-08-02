import { vi } from 'vitest';

vi.mock('../../api', () => ({
  getBrands: vi.fn(),
  getCategories: vi.fn(),
  getCatalogueListing: vi.fn()
}));

import { getBrands, getCategories, getCatalogueListing } from '../../api';
import {
  __resetProductDirectoryCacheForTests,
  loadProductDirectoryData
} from './data';

describe('product directory data', () => {
  beforeEach(() => {
    __resetProductDirectoryCacheForTests();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('reuses the shared directory request and cache across calls', async () => {
    getCategories.mockResolvedValue([{ id: 'cat-1', name: 'Постельное белье' }]);
    getBrands.mockResolvedValue([{ id: 'brand-1', name: 'Уютный дом' }]);
    getCatalogueListing.mockResolvedValue({
      items: [
        { id: 'prod-1', name: 'Комплект сатин', isActive: true },
        { id: 'prod-2', name: 'Скрытый товар', isActive: false }
      ]
    });

    const [first, second] = await Promise.all([
      loadProductDirectoryData(),
      loadProductDirectoryData()
    ]);

    expect(getCategories).toHaveBeenCalledTimes(1);
    expect(getBrands).toHaveBeenCalledTimes(1);
    expect(getCatalogueListing).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(first.products).toEqual([
      { id: 'prod-1', name: 'Комплект сатин', isActive: true }
    ]);

    await loadProductDirectoryData();

    expect(getCategories).toHaveBeenCalledTimes(1);
    expect(getBrands).toHaveBeenCalledTimes(1);
    expect(getCatalogueListing).toHaveBeenCalledTimes(1);
  });

  it('can force-refresh the cached directory snapshot', async () => {
    getCategories
      .mockResolvedValueOnce([{ id: 'cat-1', name: 'Спальня' }])
      .mockResolvedValueOnce([{ id: 'cat-2', name: 'Ванная' }]);
    getBrands
      .mockResolvedValueOnce([{ id: 'brand-1', name: 'Luna' }])
      .mockResolvedValueOnce([{ id: 'brand-2', name: 'Nova' }]);
    getCatalogueListing
      .mockResolvedValueOnce({ items: [{ id: 'prod-1', name: 'Плед', isActive: true }] })
      .mockResolvedValueOnce({ items: [{ id: 'prod-2', name: 'Полотенце', isActive: true }] });

    await loadProductDirectoryData();
    const refreshed = await loadProductDirectoryData({ force: true });

    expect(getCategories).toHaveBeenCalledTimes(2);
    expect(getBrands).toHaveBeenCalledTimes(2);
    expect(getCatalogueListing).toHaveBeenCalledTimes(2);
    expect(refreshed.categories).toEqual([{ id: 'cat-2', name: 'Ванная' }]);
    expect(refreshed.products).toEqual([
      { id: 'prod-2', name: 'Полотенце', isActive: true }
    ]);
  });

  it('refreshes an expired directory snapshot', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-22T10:00:00Z'));
    getCategories.mockResolvedValue([]);
    getBrands.mockResolvedValue([]);
    getCatalogueListing
      .mockResolvedValueOnce({ items: [{ id: 'prod-1', name: 'First', isActive: true }] })
      .mockResolvedValueOnce({ items: [{ id: 'prod-2', name: 'Second', isActive: true }] });

    await loadProductDirectoryData();
    vi.setSystemTime(new Date('2026-06-22T10:00:31Z'));
    const refreshed = await loadProductDirectoryData();

    expect(getCatalogueListing).toHaveBeenCalledTimes(2);
    expect(refreshed.products).toEqual([{ id: 'prod-2', name: 'Second', isActive: true }]);
  });
});
