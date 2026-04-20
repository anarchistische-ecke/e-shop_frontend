import { legalTokens } from '../../data/legal/constants.js';

export const LEGAL_DOCUMENTS = [
  {
    fileName: 'privacy.html',
    path: '/konfidentsialnost-i-zashchita-informatsii',
    title: 'Политика обработки персональных данных',
    summary: 'Правила обработки и защиты персональных данных пользователей и покупателей.',
  },
  {
    fileName: 'user-agreement.html',
    path: '/polzovatelskoe-soglashenie',
    title: 'Пользовательское соглашение',
    summary: 'Условия использования сайта и ответственность сторон.',
  },
  {
    fileName: 'pd-consent.html',
    path: '/soglasie-na-obrabotku-pd',
    title: 'Согласие на обработку персональных данных',
    summary: 'Форма согласия на обработку данных в рамках работы сайта.',
  },
  {
    fileName: 'ads-consent.html',
    path: '/soglasie-na-poluchenie-reklamy',
    title: 'Согласие на получение рекламы',
    summary: 'Порядок подписки и отказа от рекламных сообщений.',
  },
  {
    fileName: 'cookies.html',
    path: '/cookies',
    title: 'Политика в отношении cookie',
    summary: 'Информация об использовании cookie и иных технологий аналитики.',
  },
  {
    fileName: 'sales-terms.html',
    path: '/usloviya-prodazhi',
    title: 'Условия продажи (публичная оферта)',
    summary: 'Правила оформления заказов, оплаты, доставки и возврата товара.',
  },
];

export const LEGAL_DOCUMENT_BY_FILE = LEGAL_DOCUMENTS.reduce((acc, item) => {
  acc[item.fileName] = item;
  return acc;
}, {});

export function resolvePublicUrl(basePath = '') {
  const normalizedPath = String(basePath || '').replace(/\/$/, '');
  return normalizedPath === '/' ? '' : normalizedPath;
}

export function buildLegalRuntimeTokens({ publicUrl = '', siteUrl = '' } = {}) {
  const nextSiteUrl = String(siteUrl || legalTokens.SITE_URL).replace(/\/$/, '') || legalTokens.SITE_URL;
  let siteHost = legalTokens.SITE_HOST;

  try {
    siteHost = nextSiteUrl ? new URL(nextSiteUrl).host : siteHost;
  } catch (error) {
    siteHost = legalTokens.SITE_HOST;
  }

  return {
    ...legalTokens,
    PUBLIC_URL: resolvePublicUrl(publicUrl),
    SITE_URL: nextSiteUrl,
    SITE_HOST: siteHost,
  };
}

export function applyLegalTokens(html, tokens) {
  return Object.entries(tokens).reduce((acc, [key, value]) => {
    return acc.split(`{{${key}}}`).join(value ?? '');
  }, html);
}
