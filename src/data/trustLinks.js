import { legalTokens } from './legal/constants';

export const TRUST_LINKS = [
  {
    id: 'delivery',
    title: 'Доставка и возврат',
    description: 'Варианты доставки согласует менеджер после заказа.',
    path: '/info/delivery'
  },
  {
    id: 'payment',
    title: 'Безопасная оплата',
    description: 'Карты, СБП, чеки и подтверждение оплаты.',
    path: '/info/payment'
  },
  {
    id: 'production',
    title: 'Собственное производство',
    description: 'Материалы, пошив и контроль качества.',
    path: '/info/production'
  },
  {
    id: 'bonuses',
    title: 'Бонусы и лояльность',
    description: 'Как начисляются и списываются бонусы.',
    path: '/info/bonuses'
  },
  {
    id: 'legal',
    title: 'Реквизиты и документы',
    description: `Оферта, политика данных и реквизиты ${legalTokens.LEGAL_ENTITY_SHORT}.`,
    path: '/info/legal'
  }
];

export const CHECKOUT_TRUST_LINK_IDS = ['delivery', 'payment', 'legal'];
export const MOBILE_TRUST_LINK_IDS = ['delivery', 'payment', 'production', 'legal'];

export const TRUST_LINKS_BY_ID = TRUST_LINKS.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});
