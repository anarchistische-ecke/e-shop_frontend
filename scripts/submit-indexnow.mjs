import { readEnv } from '../src/config/runtime.js';
import { legalTokens } from '../src/data/legal/constants.js';

function normalizeOrigin(value = '') {
  try {
    return new URL(value || legalTokens.SITE_URL).origin.replace(/\/$/, '');
  } catch (error) {
    return legalTokens.SITE_URL;
  }
}

function extractSitemapUrls(xml = '') {
  return Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g))
    .map((match) =>
      match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim()
    )
    .filter(Boolean);
}

async function main() {
  const siteUrl = normalizeOrigin(readEnv('REACT_APP_SITE_URL') || readEnv('REACT_APP_CANONICAL_ORIGIN'));
  const key = readEnv('INDEXNOW_KEY');
  const endpoint = readEnv('INDEXNOW_ENDPOINT', 'https://yandex.com/indexnow');
  const sitemapUrl = readEnv('INDEXNOW_SITEMAP_URL', `${siteUrl}/sitemap.xml`);

  if (!key) {
    throw new Error('INDEXNOW_KEY is required.');
  }

  const sitemapResponse = await fetch(sitemapUrl);
  if (!sitemapResponse.ok) {
    throw new Error(`Failed to fetch sitemap: ${sitemapResponse.status} ${sitemapResponse.statusText}`);
  }

  const urls = extractSitemapUrls(await sitemapResponse.text());
  if (!urls.length) {
    throw new Error('No URLs found in sitemap.');
  }

  const payload = {
    host: new URL(siteUrl).host,
    key,
    keyLocation: `${siteUrl}/${key}.txt`,
    urlList: urls
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  });

  if (!response.ok && response.status !== 202) {
    const body = await response.text().catch(() => '');
    throw new Error(`IndexNow submission failed: ${response.status} ${response.statusText} ${body}`.trim());
  }

  console.log(`Submitted ${urls.length} URLs to IndexNow: ${response.status}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
