/**
 * Top level product categories.  In the real store each of these
 * categories has a rich taxonomy of sub‑categories.  For the purpose
 * of this front‑end replica we only need a handful of entries to
 * demonstrate navigation.  Each category has a unique slug used in
 * URLs and a display name shown to users.
 */
export const categories = [
  {
    slug: 'autumn',
    name: 'Осень',
    subcategories: ['Текстиль', 'Декор', 'Осенние новинки'],
  },
  {
    slug: 'new',
    name: 'Новинки',
    subcategories: ['Последние поступления', 'Топ новинки', 'Хиты сезона'],
  },
  {
    slug: 'bedroom',
    name: 'Спальня',
    subcategories: ['Постельное белье', 'Покрывала', 'Подушки', 'Одеяла', 'Пледы'],
  },
  {
    slug: 'clothing',
    name: 'Одежда',
    subcategories: ['Халаты', 'Домашняя одежда', 'Пижамы', 'Носки'],
  },
  {
    slug: 'dining',
    name: 'Столовая',
    subcategories: ['Посуда', 'Столовый текстиль', 'Бокалы', 'Сервизы', 'Приборы'],
  },
  {
    slug: 'decor',
    name: 'Декор',
    subcategories: ['Свечи', 'Вазы', 'Картины', 'Светильники', 'Статуэтки'],
  },
  {
    slug: 'bathroom',
    name: 'Ванная',
    subcategories: ['Полотенца', 'Коврики', 'Наборы для ванной', 'Аксессуары'],
  },
  {
    slug: 'cleaning',
    name: 'Уборка',
    subcategories: ['Уборочные средства', 'Хранение', 'Аксессуары'],
  },
  {
    slug: 'fragrances',
    name: 'Ароматы',
    subcategories: ['Диффузоры', 'Свечи', 'Саше'],
  },
  {
    slug: 'cosmetics',
    name: 'Косметика',
    subcategories: ['Уход для тела', 'Мыло', 'Кремы', 'Скрабы'],
  },
  {
    slug: 'custom',
    name: 'Свой комплект',
    subcategories: ['Собери комплект', 'Индивидуальный подбор'],
  },
];