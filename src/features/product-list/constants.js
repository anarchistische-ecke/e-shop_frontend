export const PRODUCT_LIST_PAGE_SIZE = 12;
export const PRODUCT_LIST_DEFAULT_SORT = 'bestMatch';
export const PRODUCT_LIST_NEW_DEFAULT_SORT = 'newest';

export const PRODUCT_LIST_SORT_OPTIONS = [
  { value: 'bestMatch', label: 'Лучшее совпадение' },
  { value: 'newest', label: 'Сначала новые' },
  { value: 'priceAsc', label: 'Цена: по возрастанию' },
  { value: 'priceDesc', label: 'Цена: по убыванию' },
  { value: 'rating', label: 'Рейтинг' },
  { value: 'discount', label: 'По скидке' }
];

export const PRODUCT_LIST_RATING_OPTIONS = [
  { value: '', label: 'Любой' },
  { value: '4.5', label: 'От 4.5' },
  { value: '4', label: 'От 4.0' },
  { value: '3.5', label: 'От 3.5' }
];
