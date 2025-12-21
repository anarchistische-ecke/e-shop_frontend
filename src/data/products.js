export const products = [
  {
    id: 'set-cinque',
    slug: 'set-cinque',
    name: 'Комплект Cinque Terre',
    category: 'bed-linen',
    price: 5490,
    oldPrice: 6290,
    rating: 4.9,
    description: 'Сатин 100% хлопок в пастельных тонах, вдохновлённых итальянским побережьем.',
    images: [
      {
        id: 'set-cinque-euro-1',
        url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
        variantId: 'set-cinque-euro'
      },
      {
        id: 'set-cinque-family-1',
        url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80',
        variantId: 'set-cinque-family'
      },
      {
        id: 'set-cinque-hero',
        url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80'
      }
    ],
    variants: [
      { id: 'set-cinque-euro', name: 'Евро', price: 5490, stock: 14 },
      { id: 'set-cinque-family', name: 'Семейный', price: 5990, stock: 6 }
    ]
  },
  {
    id: 'set-alienor',
    slug: 'set-alienor',
    name: 'Комплект Alienor',
    category: 'bed-linen',
    price: 4890,
    oldPrice: 0,
    rating: 4.7,
    description: 'Жаккардовый узор и гладкая наволочка для любителей классических интерьеров.',
    images: [
      {
        id: 'set-alienor-hero',
        url: 'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=900&q=80',
        variantId: 'set-alienor-queen'
      }
    ],
    variants: [{ id: 'set-alienor-queen', name: 'Двуспальный', price: 4890, stock: 10 }]
  },
  {
    id: 'throw-tweed',
    slug: 'throw-tweed',
    name: 'Плед Tweed Soft',
    category: 'blankets',
    price: 3190,
    oldPrice: 3590,
    rating: 4.6,
    description: 'Мягкий плед из микрофибры с лёгким объёмом и твидовым переплетением.',
    images: [
      {
        id: 'throw-tweed-hero',
        url: 'https://images.unsplash.com/photo-1489278353717-f64c6ee8a4d2?auto=format&fit=crop&w=900&q=80',
        variantId: 'throw-tweed-130'
      }
    ],
    variants: [{ id: 'throw-tweed-130', name: '130×170 см', price: 3190, stock: 20 }]
  },
  {
    id: 'towel-cloud',
    slug: 'towel-cloud',
    name: 'Набор полотенец Cloud',
    category: 'bath',
    price: 2190,
    oldPrice: 2490,
    rating: 4.5,
    description: 'Два махровых полотенца плотностью 500 г/м²: мягкие, впитывающие, быстро сохнут.',
    images: [
      {
        id: 'towel-cloud-hero',
        url: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80',
        variantId: 'towel-cloud-set'
      }
    ],
    variants: [{ id: 'towel-cloud-set', name: '50×90 + 70×140', price: 2190, stock: 15 }]
  },
  {
    id: 'kids-stars',
    slug: 'kids-stars',
    name: 'Детский комплект Starry Night',
    category: 'kids',
    price: 3290,
    rating: 4.8,
    description: 'Хлопковый комплект с лампочками-звёздами, дружелюбный к детской коже.',
    images: [
      {
        id: 'kids-stars-hero',
        url: 'https://images.unsplash.com/photo-1600490036275-35f9a0917483?auto=format&fit=crop&w=900&q=80',
        variantId: 'kids-stars-1.5'
      }
    ],
    variants: [{ id: 'kids-stars-1.5', name: '1.5-спальный', price: 3290, stock: 12 }]
  },
  {
    id: 'candle-amber',
    slug: 'candle-amber',
    name: 'Свеча Amber Home',
    category: 'decor',
    price: 1190,
    rating: 4.4,
    description: 'Тёплый аромат амбры и сандала, хлопковый фитиль, стеклянная банка.',
    images: [
      {
        id: 'candle-amber-hero',
        url: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80',
        variantId: 'candle-amber-200'
      }
    ],
    variants: [{ id: 'candle-amber-200', name: '200 мл', price: 1190, stock: 25 }]
  }
];

export default products;
