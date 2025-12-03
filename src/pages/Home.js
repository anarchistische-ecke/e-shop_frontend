import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../api';
import { reviews } from '../data/reviews';
import { getPrimaryImageUrl } from '../utils/product';

/**
 * Home page mirrors the landing page of the original shop but
 * retrieves its product and category data from the backend.  The
 * layout includes several horizontal carousels, a hero section and
 * various static sections.  Products are displayed using the
 * ProductCard component which handles Money objects from the API.
 */
function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bannerText, setBannerText] = useState('');
  const [bannerEnabled, setBannerEnabled] = useState(true);

  useEffect(() => {
    getProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch products:', err));
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err));
    // Load banner from admin content (stored in localStorage)
    if (typeof window !== 'undefined') {
      const storedBanner = localStorage.getItem('adminBanner');
      setBannerText(storedBanner || '');
      const enabled = localStorage.getItem('adminBannerEnabled');
      setBannerEnabled(enabled === null ? true : enabled === 'true');
    }
  }, []);

  // Feature boxes below the hero section
  const features = [
    {
      icon: '🎁',
      title: 'Бонусы за покупки',
      subtitle: 'Авторизуйтесь и копите баллы',
    },
    {
      icon: '💳',
      title: 'Удобная оплата',
      subtitle: 'Картой, СБП или частями',
    },
    {
      icon: '🚚',
      title: 'Доставка от 5000 ₽',
      subtitle: 'Курьером или в пункт выдачи',
    },
    {
      icon: '🧵',
      title: 'Собственное производство',
      subtitle: 'Контроль качества на каждом этапе',
    },
  ];

  // Sample collections (static descriptive blocks)
  const collections = [
    {
      title: 'Cinque Terre',
      description:
        'Коллекция постельного белья из сатина: 100% хлопок, пастельные оттенки и лаконичные принты вдохновлены атмосферой итальянских побережий.',
    },
    {
      title: 'Alienor',
      description:
        'Воплощение европейского духа XII века: роскошные узоры и сложные переплетения на ткани создают изысканный образ.',
    },
    {
      title: 'Taj Mahal',
      description:
        'Сочетание утончённой эстетики, природной красоты и восточного колорита — для ценителей ярких акцентов.',
    },
  ];

  const featuredProduct = products[0] || null;
  const heroImage = getPrimaryImageUrl(featuredProduct);

  return (
    <div className="home bg-gradient-to-b from-secondary/80 via-white to-white">
      {bannerText && bannerEnabled && (
        <div className="bg-primary text-white text-center py-2 px-4">
          <p className="text-sm">{bannerText}</p>
        </div>
      )}
      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <p className="uppercase text-xs tracking-widest text-muted">уютная новая коллекция</p>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
              Обновите спальню <span className="text-primary">с акцентом на комфорт</span>
            </h1>
            <p className="text-base text-muted">
              Натуральные ткани, мягкие цвета и текстуры, продуманные комплекты для спальни и гостиной. Закажите онлайн и получите доставку в удобное место.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/category/popular" className="button">Смотреть бестселлеры</Link>
              <Link to="/category/new" className="button-gray">Новинки</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {features.slice(0, 4).map((feat) => (
                <div key={feat.title} className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-start gap-2 shadow-sm">
                  <span className="text-lg">{feat.icon}</span>
                  <div>
                    <p className="text-sm font-semibold mb-0">{feat.title}</p>
                    <p className="text-xs text-muted mb-0">{feat.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-white via-secondary/70 to-white pointer-events-none" />
            <div className="relative pt-[90%]">
              {heroImage ? (
                <img src={heroImage} alt={featuredProduct?.name || 'Товар'} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">Добавьте фото товара, чтобы показать его здесь</div>
              )}
            </div>
            <div className="relative p-4 flex items-center justify-between border-t border-gray-100 bg-white/90 backdrop-blur">
              <div>
                <p className="text-sm text-muted mb-1">Избранный товар</p>
                <p className="font-semibold">{featuredProduct?.name || 'Новый плед'}</p>
              </div>
              <Link to={featuredProduct ? `/product/${featuredProduct.id}` : '/category/popular'} className="button text-sm px-3 py-2">
                Подробнее
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Быстрый переход по категориям</h2>
          <Link to="/category/popular" className="text-primary text-sm">В каталог</Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {(categories || []).slice(0, 8).map((cat) => (
            <Link
              key={cat.slug || cat.id}
              to={`/category/${cat.slug || cat.id}`}
              className="px-4 py-3 rounded-full bg-white border border-gray-200 hover:border-primary transition-colors shadow-sm"
            >
              <p className="text-sm font-semibold mb-0">{cat.name}</p>
              <p className="text-xs text-muted mb-0">{cat.description || 'Перейти'}</p>
            </Link>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted">Категории появятся после добавления в админке.</p>
          )}
        </div>
      </section>

      <section className="py-8 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Популярные товары</h2>
            <Link to="/category/popular" className="text-primary text-sm">
              Смотреть все
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {products.slice(0, 8).map((prod) => (
              <div key={prod.id} className="flex-shrink-0 w-64 snap-start">
                <ProductCard product={prod} />
              </div>
            ))}
            {products.length === 0 && (
              <div className="text-sm text-muted">Добавьте товары в каталоге, чтобы показать их здесь.</div>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Новинки</h2>
          <Link to="/category/new" className="text-primary text-sm">
            Смотреть все
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.slice(0, 4).map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-sm text-muted">Новинки появятся после добавления товаров.</div>
          )}
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Коллекции</h2>
            <Link to="/category/collections" className="text-primary text-sm">
              Смотреть все
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {collections.map((coll) => (
              <div
                key={coll.title}
                className="bg-gradient-to-br from-secondary to-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
              >
                <div className="h-36 bg-[#e9e7e3]" />
                <div className="p-4 flex flex-col gap-2">
                  <h4 className="font-semibold">{coll.title}</h4>
                  <p className="text-sm text-muted flex-1">{coll.description}</p>
                  <Link to="/category/collections" className="text-primary text-sm">
                    Смотреть коллекцию
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Отзывы</h2>
          <Link to="/about" className="text-primary text-sm">
            О бренде
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {reviews.map((rev, idx) => {
            const product = products.find((p) => p.id === rev.productId);
            return (
              <div
                key={idx}
                className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-lg overflow-hidden snap-start shadow-sm"
              >
                <div className="p-4 flex flex-col justify-between h-full">
                  <div className="mb-3">
                    <h4 className="text-base font-semibold mb-1">{product ? product.name : 'Товар'}</h4>
                    <div className="text-primary text-sm mb-2">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                    <p className="text-sm mb-3">{rev.text}</p>
                  </div>
                  <p className="text-xs text-muted italic m-0">— {rev.author}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4 max-w-3xl text-center bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Постельное Белье‑Юг — интернет‑магазин домашнего текстиля</h2>
          <p className="text-base text-muted mt-4">
            Собственное производство, проверенные материалы и честный сервис. Здесь легко подобрать комплект под стиль вашего дома: фильтры по категориям, брендам и готовые подборки облегчают выбор.
          </p>
          <Link to="/about" className="button mt-4 inline-block">
            Подробнее о нас
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
