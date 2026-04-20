import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readEnv } from '../src/config/runtime.js';
import { legalTokens } from '../src/data/legal/constants.js';
import { matchStorefrontRoute } from '../src/ssr/routeConfig.js';
import {
  buildClientRuntimeConfig,
  loadSsrRequestData
} from './ssr-data.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const clientDistDir = path.join(projectRoot, 'dist', 'client');
const devIndexPath = path.join(projectRoot, 'index.html');
const prodIndexPath = path.join(clientDistDir, 'index.html');
const PROD_RENDER_MODULE_CANDIDATES = [
  path.join(projectRoot, 'dist', 'server', 'entry-server.js'),
  path.join(projectRoot, 'dist', 'server', 'entry-server.mjs')
];
const DEFAULT_HEAD_TAGS = `
<title>Постельное Белье-ЮГ</title>
<meta name="description" content="Постельное белье, пледы, полотенца и домашний текстиль с доставкой по России. Натуральные ткани, безопасная оплата и понятные условия покупки." />
<meta property="og:site_name" content="Постельное Белье-ЮГ" />
<meta property="og:locale" content="ru_RU" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary" />
<meta name="robots" content="index,follow" />
`.trim();

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function serializeForScript(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    switch (character) {
      case '<':
        return '\\u003c';
      case '>':
        return '\\u003e';
      case '&':
        return '\\u0026';
      case '\u2028':
        return '\\u2028';
      case '\u2029':
        return '\\u2029';
      default:
        return character;
    }
  });
}

function renderHelmetTags(helmet = {}) {
  const keys = ['title', 'priority', 'meta', 'link', 'style', 'script', 'noscript', 'base'];
  const renderedTags = keys
    .map((key) => helmet?.[key]?.toString?.() || '')
    .filter(Boolean)
    .join('');

  return renderedTags || DEFAULT_HEAD_TAGS;
}

function injectRenderedApp(template, { appHtml, helmet, ssrData, runtimeConfig }) {
  const stateScripts = [
    `<script>window.__APP_CONFIG__=${serializeForScript(runtimeConfig)};</script>`,
    `<script>window.__SSR_DATA__=${serializeForScript(ssrData)};</script>`
  ].join('');

  return template
    .replace('<!--app-head-->', renderHelmetTags(helmet))
    .replace('<!--app-html-->', appHtml)
    .replace('<!--app-state-->', stateScripts);
}

function resolveCanonicalOrigin() {
  return (
    String(
      readEnv('REACT_APP_SITE_URL') ||
        readEnv('REACT_APP_CANONICAL_ORIGIN') ||
        legalTokens.SITE_URL
    )
      .trim()
      .replace(/\/$/, '') || legalTokens.SITE_URL
  );
}

function resolveRequestOrigin(req) {
  const forwardedHost = req.get('x-forwarded-host');
  const host = forwardedHost || req.get('host') || '';
  const forwardedProto = req.get('x-forwarded-proto');
  const protocol = forwardedProto
    ? forwardedProto.split(',')[0].trim()
    : req.protocol || 'http';

  if (!host) {
    return resolveCanonicalOrigin();
  }

  return `${protocol}://${host}`;
}

function resolveLegacyHomeTarget(req) {
  const suffix = req.path.slice('/home'.length).replace(/^\/+/, '/');
  const pathname = suffix || '/';
  const queryIndex = req.originalUrl.indexOf('?');
  const search = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';
  return `${pathname}${search}`;
}

function resolveHtmlCacheControl(route, statusCode) {
  if (route.renderMode === 'ssr' && statusCode === 200) {
    return 'public, max-age=0, s-maxage=60, stale-while-revalidate=300';
  }

  return 'no-store';
}

function setStaticHeaders(res, filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (normalizedPath.includes('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return;
  }

  if (
    normalizedPath.includes('/legal-assets/') ||
    normalizedPath.includes('/legal-docs/')
  ) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return;
  }

  if (
    normalizedPath.endsWith('/robots.txt') ||
    normalizedPath.endsWith('/sitemap.xml') ||
    normalizedPath.endsWith('/silent-check-sso.html')
  ) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=300');
}

async function loadProductionRenderModule() {
  for (const candidatePath of PROD_RENDER_MODULE_CANDIDATES) {
    try {
      await fs.access(candidatePath);
      return import(pathToFileURL(candidatePath).href);
    } catch (error) {
    }
  }

  throw new Error('Missing built SSR entry module in dist/server.');
}

function isDirectExecution() {
  return process.argv[1] && path.resolve(process.argv[1]) === __filename;
}

export async function createStorefrontServer(options = {}) {
  const mode =
    options.mode || (process.env.NODE_ENV === 'production' ? 'production' : 'development');
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';
  const app = express();
  let viteServer = options.viteServer || null;
  let cachedProductionTemplate = options.template || null;
  let cachedRenderModule = options.renderModule || null;

  app.disable('x-powered-by');
  app.set('trust proxy', true);

  app.use((req, res, next) => {
    const canonicalOrigin = resolveCanonicalOrigin();
    let canonicalHost = '';

    try {
      canonicalHost = new URL(canonicalOrigin).hostname;
    } catch (error) {
      return next();
    }

    if (req.hostname === `www.${canonicalHost}`) {
      res.redirect(301, `${canonicalOrigin}${req.originalUrl}`);
      return;
    }

    next();
  });

  app.use((req, res, next) => {
    if (req.path === '/home' || req.path.startsWith('/home/')) {
      res.redirect(301, resolveLegacyHomeTarget(req));
      return;
    }

    next();
  });

  if (isDevelopment && !viteServer && !options.renderModule) {
    const { createServer } = await import('vite');
    viteServer = await createServer({
      appType: 'custom',
      server: {
        middlewareMode: true
      }
    });
    app.use(viteServer.middlewares);
  } else if (isProduction) {
    app.use(
      express.static(clientDistDir, {
        index: false,
        setHeaders: setStaticHeaders
      })
    );
  }

  app.get('/healthz', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true });
  });

  app.use(async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    if (path.extname(req.path)) {
      res.status(404).setHeader('Cache-Control', 'no-store').end();
      return;
    }

    try {
      const { route, params } = matchStorefrontRoute(req.path);
      const requestOrigin = resolveRequestOrigin(req);
      const runtimeConfig = buildClientRuntimeConfig({ requestOrigin });
      const { ssrData, statusCode } = await loadSsrRequestData({
        route,
        params,
        requestOrigin
      });
      const renderModule =
        options.renderModule ||
        cachedRenderModule ||
        (viteServer
          ? await viteServer.ssrLoadModule('/src/entry-server.jsx')
          : await loadProductionRenderModule());
      const render =
        typeof renderModule.render === 'function'
          ? renderModule.render
          : renderModule.default?.render;

      if (typeof render !== 'function') {
        throw new Error('SSR render module does not export a render() function.');
      }

      const template = options.template
        ? options.template
        : viteServer
        ? await viteServer.transformIndexHtml(
            req.originalUrl,
            await fs.readFile(devIndexPath, 'utf8')
          )
        : cachedProductionTemplate ||
          (cachedProductionTemplate = await fs.readFile(prodIndexPath, 'utf8'));
      const { appHtml, helmet } = await render(req.originalUrl, ssrData);
      const html = injectRenderedApp(template, {
        appHtml,
        helmet,
        ssrData,
        runtimeConfig
      });

      cachedRenderModule = renderModule;
      res
        .status(statusCode)
        .setHeader('Content-Type', 'text/html; charset=utf-8')
        .setHeader('Cache-Control', resolveHtmlCacheControl(route, statusCode))
        .end(html);
    } catch (error) {
      if (viteServer) {
        viteServer.ssrFixStacktrace(error);
      }
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    if (res.headersSent) {
      return;
    }

    res
      .status(500)
      .setHeader('Cache-Control', 'no-store')
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .end(
        mode === 'production'
          ? 'Internal Server Error'
          : `<pre>${escapeHtml(error?.stack || error?.message || String(error))}</pre>`
      );
  });

  return {
    app,
    viteServer,
    async close() {
      if (viteServer) {
        await viteServer.close();
      }
    }
  };
}

async function startServer() {
  const host = process.env.HOST || '0.0.0.0';
  const port = Number(process.env.PORT || '3000');
  const { app } = await createStorefrontServer();

  app.listen(port, host, () => {
    console.log(`Storefront SSR server listening on http://${host}:${port}`);
  });
}

if (isDirectExecution()) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
