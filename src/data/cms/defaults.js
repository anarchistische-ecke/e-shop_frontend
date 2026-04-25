import { legalTokens } from '../legal/constants';

export const DEFAULT_CMS_SITE_SETTINGS = {
  siteName: legalTokens.SITE_NAME,
  brandDescription:
    'Спокойный дом начинается с мягких тканей. Мы подбираем натуральные материалы, чтобы отдых был таким же уютным, как объятия любимого пледа.',
  supportPhone: legalTokens.LEGAL_PHONE,
  supportEmail: legalTokens.LEGAL_EMAIL,
  legalEntityShort: legalTokens.LEGAL_ENTITY_SHORT,
  legalEntityFull: legalTokens.LEGAL_ENTITY_LONG,
  legalInn: legalTokens.LEGAL_INN,
  legalOgrnip: legalTokens.LEGAL_OGRNIP,
  legalAddress: legalTokens.LEGAL_ADDRESS,
  copyrightStartYear: 2015,
  defaultSeoTitleSuffix: legalTokens.SITE_NAME,
  defaultSeoDescription:
    'Домашний текстиль для уютного дома: доставка по России, честные условия покупки и собственное производство.',
  defaultOgImage: null,
};

export const DEFAULT_HEADER_NAVIGATION = [
  {
    key: 'header_main',
    title: 'Полезное',
    placement: 'header',
    description: 'Основные сервисные ссылки в шапке сайта.',
    sort: 1,
    items: [
      { label: 'О бренде', url: '/about', itemType: 'link', openInNewTab: false, sort: 1 },
      {
        label: 'Доставка',
        url: '/info/delivery',
        itemType: 'link',
        openInNewTab: false,
        sort: 2,
      },
      {
        label: 'Оплата',
        url: '/info/payment',
        itemType: 'link',
        openInNewTab: false,
        sort: 3,
      },
      {
        label: 'Документы',
        url: '/info/legal',
        itemType: 'link',
        openInNewTab: false,
        sort: 4,
      },
    ],
  },
];

export const DEFAULT_FOOTER_NAVIGATION = [
  {
    key: 'footer_catalog',
    title: 'Каталог',
    placement: 'footer',
    description: 'Основные ссылки каталога в футере.',
    sort: 1,
    items: [
      { label: 'Все категории', url: '/catalog', itemType: 'link', openInNewTab: false, sort: 1 },
      { label: 'Бестселлеры', url: '/category/popular', itemType: 'link', openInNewTab: false, sort: 2 },
      { label: 'Новинки', url: '/category/new', itemType: 'link', openInNewTab: false, sort: 3 },
    ],
  },
  {
    key: 'footer_service',
    title: 'Сервис',
    placement: 'footer',
    description: 'Сервисные страницы в футере.',
    sort: 2,
    items: [
      {
        label: 'Доставка и самовывоз',
        url: '/info/delivery',
        itemType: 'link',
        openInNewTab: false,
        sort: 1,
      },
      {
        label: 'Доставка и возврат',
        url: '/usloviya-prodazhi#return',
        itemType: 'link',
        openInNewTab: false,
        sort: 2,
      },
      { label: 'Способы оплаты', url: '/info/payment', itemType: 'link', openInNewTab: false, sort: 3 },
      { label: 'Акции и промокоды', url: '/account#promocodes', itemType: 'link', openInNewTab: false, sort: 4 },
      { label: 'Производство', url: '/info/production', itemType: 'link', openInNewTab: false, sort: 5 },
    ],
  },
  {
    key: 'footer_account',
    title: 'Аккаунт',
    placement: 'footer',
    description: 'Пользовательские ссылки в футере.',
    sort: 3,
    items: [
      { label: 'Войти', url: '/login', itemType: 'link', openInNewTab: false, sort: 1 },
      { label: 'Личный кабинет', url: '/account', itemType: 'link', openInNewTab: false, sort: 2 },
      { label: 'Корзина', url: '/cart', itemType: 'link', openInNewTab: false, sort: 3 },
    ],
  },
  {
    key: 'footer_legal',
    title: 'Документы',
    placement: 'footer',
    description: 'Юридические документы в футере.',
    sort: 4,
    items: [
      { label: 'Реквизиты и документы', url: '/info/legal', itemType: 'link', openInNewTab: false, sort: 1 },
      {
        label: 'Политика обработки персональных данных',
        url: '/konfidentsialnost-i-zashchita-informatsii',
        itemType: 'link',
        openInNewTab: false,
        sort: 2,
      },
      { label: 'Условия продажи', url: '/usloviya-prodazhi', itemType: 'link', openInNewTab: false, sort: 3 },
    ],
  },
];
