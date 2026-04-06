function svgDataUrl(label, fill) {
  const markup = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
      <rect width="640" height="640" rx="48" fill="${fill}" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="42" fill="#2b2722">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`;
}

const categories = [
  {
    id: 'popular',
    slug: 'popular',
    name: 'Популярное',
    description: 'Бестселлеры для спальни и дома.',
    position: 1,
    imageUrl: svgDataUrl('Популярное', '#efe3d6'),
  },
  {
    id: 'new',
    slug: 'new',
    name: 'Новинки',
    description: 'Свежие поступления.',
    position: 2,
    imageUrl: svgDataUrl('Новинки', '#e5ece2'),
  },
  {
    id: 'throws',
    slug: 'throws',
    name: 'Пледы',
    description: 'Пледы и мягкие акценты.',
    position: 3,
    imageUrl: svgDataUrl('Пледы', '#f3ebe1'),
  },
];

const brands = [
  { id: 'brand-cozy', slug: 'cozy-home', name: 'Cozy Home' },
  { id: 'brand-luna', slug: 'luna-soft', name: 'Luna Soft' },
];

const products = [
  {
    id: 'prod-satin-sand',
    slug: 'satin-sand',
    name: 'Сатиновый комплект Sand',
    price: 4200,
    oldPrice: 5100,
    rating: 4.9,
    reviewCount: 18,
    material: 'Сатин',
    category: 'popular',
    brand: 'cozy-home',
    description: 'Комплект из мягкого сатина для спокойной спальни.',
    variants: [
      {
        id: 'var-satin-sand-200',
        name: '200×220',
        price: 4200,
        oldPrice: 5100,
        stock: 7,
      },
    ],
    images: [
      {
        id: 'img-satin-sand-1',
        url: svgDataUrl('Sand', '#ead7c7'),
        alt: 'Сатиновый комплект Sand',
      },
    ],
  },
  {
    id: 'prod-throw-cloud',
    slug: 'throw-cloud',
    name: 'Плед Cloud',
    price: 2600,
    rating: 4.6,
    reviewCount: 9,
    material: 'Хлопок',
    category: 'throws',
    brand: 'luna-soft',
    description: 'Лёгкий плед для гостиной и спальни.',
    variants: [
      {
        id: 'var-throw-cloud',
        name: '130×170',
        price: 2600,
        stock: 0,
      },
    ],
    images: [
      {
        id: 'img-throw-cloud-1',
        url: svgDataUrl('Cloud', '#dfe8ef'),
        alt: 'Плед Cloud',
      },
    ],
  },
  {
    id: 'prod-towels-moss',
    slug: 'towels-moss',
    name: 'Набор полотенец Moss',
    price: 1800,
    rating: 4.4,
    reviewCount: 6,
    material: 'Махра',
    category: 'new',
    brand: 'cozy-home',
    description: 'Набор полотенец с мягкой фактурой.',
    variants: [
      {
        id: 'var-towels-moss',
        name: '3 предмета',
        price: 1800,
        stock: 5,
      },
    ],
    images: [
      {
        id: 'img-towels-moss-1',
        url: svgDataUrl('Moss', '#d7e2d3'),
        alt: 'Набор полотенец Moss',
      },
    ],
  },
];

const publicOrder = {
  id: 'order-e2e-1',
  publicToken: 'order-e2e-token',
  status: 'PENDING',
  totalAmount: 4200,
  items: [
    {
      id: 'order-item-1',
      productName: 'Сатиновый комплект Sand',
      variantName: '200×220',
      quantity: 1,
      unitPrice: 4200,
    },
  ],
  delivery: {
    deliveryType: 'COURIER',
    address: 'Москва, тестовая улица, 1',
    pricingTotal: 0,
  },
};

module.exports = {
  brands,
  categories,
  products,
  publicOrder,
};
