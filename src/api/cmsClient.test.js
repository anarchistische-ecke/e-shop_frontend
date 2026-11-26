import { afterEach, expect, it, vi } from 'vitest';
import { getCmsPage } from './index';
import cmsClient from './cmsClient';

vi.mock('./index', () => ({
  getCmsCampaign: vi.fn(),
  getCmsCampaigns: vi.fn(),
  getCmsCollection: vi.fn(),
  getCmsLegalDocument: vi.fn(),
  getCmsNavigation: vi.fn(),
  getCmsPage: vi.fn(),
  getCmsSiteSettings: vi.fn(),
  isApiRequestError: vi.fn(() => false),
}));

afterEach(() => {
  cmsClient.clearCache();
  vi.resetAllMocks();
});

it('starts a fresh CMS request after an aborted render and retains the fresh result', async () => {
  const controller = new AbortController();
  const page = { slug: 'home', title: 'Текстиль для дома' };
  getCmsPage
    .mockImplementationOnce((_, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }))
    .mockResolvedValueOnce(page);

  const firstRequest = cmsClient.getPage('home', { signal: controller.signal, cacheTtlMs: 1000 });
  const aborted = expect(firstRequest).rejects.toMatchObject({ name: 'AbortError' });
  controller.abort();

  await expect(cmsClient.getPage('home', { cacheTtlMs: 1000 })).resolves.toEqual(page);
  await aborted;
  await expect(cmsClient.getPage('home')).resolves.toEqual(page);
  expect(getCmsPage).toHaveBeenCalledTimes(2);
});
