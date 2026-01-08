import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../api';
import { reviews } from '../data/reviews';
import { homeHeroDefaults } from '../data/homeHeroDefaults';
import { getPrimaryImageUrl, getProductPrice } from '../utils/product';

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bannerText, setBannerText] = useState('');
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [heroConfig, setHeroConfig] = useState(() => ({ ...homeHeroDefaults }));

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
      const storedHero = localStorage.getItem('homeHeroConfig');
      if (storedHero) {
        try {
          const parsed = JSON.parse(storedHero);
          setHeroConfig({ ...homeHeroDefaults, ...parsed });
        } catch (err) {
          console.error('Failed to parse home hero config', err);
          setHeroConfig({ ...homeHeroDefaults });
        }
      }
    }
  }, []);

  const heroTitle = heroConfig.title || homeHeroDefaults.title;
  const heroAccent = heroConfig.accent || homeHeroDefaults.accent;
  const heroSubtitle = heroConfig.subtitle || homeHeroDefaults.subtitle;
  const primaryCtaLabel = heroConfig.primaryCtaLabel || homeHeroDefaults.primaryCtaLabel;
  const primaryCtaLink = heroConfig.primaryCtaLink || homeHeroDefaults.primaryCtaLink;
  const secondaryCtaLabel = heroConfig.secondaryCtaLabel || homeHeroDefaults.secondaryCtaLabel;
  const secondaryCtaLink = heroConfig.secondaryCtaLink || homeHeroDefaults.secondaryCtaLink;
  const featuredLabel = heroConfig.featuredLabel || homeHeroDefaults.featuredLabel;
  const badgeText = heroConfig.badge || homeHeroDefaults.badge;

  const heroHighlights = [
    {
      title: 'Натуральные ткани без компромиссов',
      subtitle: 'Сатин, лен и бамбук с мягкой фактурой.',
    },
    {
      title: '365 дней на возврат и тест',
      subtitle: 'Попробуйте дома и верните, если не влюбитесь.',
    },
    {
      title: 'Бесплатная доставка от 5000 ₽',
      subtitle: 'Курьером или в пункт выдачи, без доплат.',
    },
    {
      title: 'Собственное производство',
      subtitle: 'Контроль качества на каждом этапе пошива.',
    },
  ];

  const trustMetrics = [
    { title: '150k+', subtitle: '5‑звёздочных отзывов от покупателей' },
    { title: 'Oeko‑Tex', subtitle: 'Сертифицированные ткани без раздражителей' },
    { title: '4.9', subtitle: 'Средняя оценка качества по опросам' },
  ];

  const seasonalTiles = [
    {
      title: 'Подарочный гид',
      subtitle: 'Комплекты до 5000 ₽ и готовые наборы',
      cta: 'Выбрать подарок',
      link: '/category/popular',
    },
    {
      title: 'Осенние пледы',
      subtitle: 'Тёплые фактуры и спокойные оттенки',
      cta: 'Смотреть пледы',
      link: '/category/new',
    },
  ];

  const collections = [
    {
      title: 'Cinque Terre',
      description:
        'Пастельные оттенки сатина и лаконичные принты, вдохновлённые средиземноморскими побережьями.',
    },
    {
      title: 'Alienor',
      description:
        'Мягкий жаккард и изысканные орнаменты с европейским характером.',
    },
    {
      title: 'Taj Mahal',
      description:
        'Тактильная роскошь и восточная эстетика для выразительных интерьеров.',
    },
  ];

  const categoryAccents = [
    { gradient: 'from-[#f7f1ea] via-white to-[#f1e6dd]', orb: 'bg-[#e6d7ca]' },
    { gradient: 'from-[#f9f5f0] via-white to-[#efe3d9]', orb: 'bg-[#e3d2c2]' },
    { gradient: 'from-[#f5efe8] via-white to-[#e9ded4]', orb: 'bg-[#d9c9bb]' },
    { gradient: 'from-[#f4f0ea] via-white to-[#e6d9cd]', orb: 'bg-[#d6c5b5]' },
  ];

  const resolveProductCategoryKey = (product) => {
    const categoryValue =
      product?.category ||
      product?.categoryId ||
      product?.category_id ||
      product?.categorySlug ||
      product?.category_slug ||
      product?.category?.id ||
      product?.category?.slug ||
      product?.category?.name;
    const categoryKey =
      typeof categoryValue === 'string'
        ? categoryValue
        : categoryValue?.id || categoryValue?.slug || categoryValue?.name || '';
    return categoryKey ? String(categoryKey) : '';
  };

  const categoryMeta = useMemo(() => {
    const counts = {};
    const heroMap = {};
    products.forEach((product) => {
      const key = resolveProductCategoryKey(product);
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
      if (!heroMap[key]) heroMap[key] = product;
    });
    return { counts, heroMap };
  }, [products]);

  const featuredProduct =
    products.find((p) => p.id === heroConfig.featuredProductId) || products[0] || null;
  const heroImage = getPrimaryImageUrl(featuredProduct);
  const featuredPrice = featuredProduct ? getProductPrice(featuredProduct) : null;
  const topCategories = categories.filter((cat) => !cat.parentId);

  const resolveCategoryKey = (category) => {
    if (!category) return '';
    return String(category.slug || category.id || category.name || '');
  };

  const featuredReview = reviews[0];

  return (
    <div className="home">
      {bannerText && bannerEnabled && (
        <div className="bg-ink text-white text-center py-2 px-4">
          <p className="text-sm">{bannerText}</p>
        </div>
      )}

      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-center">
          <div className="space-y-6">
            <p className="uppercase text-xs tracking-[0.4em] text-muted">{badgeText}</p>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-semibold leading-tight">
              {heroTitle} <span className="text-primary">{heroAccent}</span>
            </h1>
            <p className="text-base text-muted max-w-xl">{heroSubtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link to={primaryCtaLink} className="button">{primaryCtaLabel}</Link>
              <Link to={secondaryCtaLink} className="button-gray">{secondaryCtaLabel}</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {heroHighlights.map((feat) => (
                <div
                  key={feat.title}
                  className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 shadow-sm"
                >
                  <p className="text-sm font-semibold mb-1">{feat.title}</p>
                  <p className="text-xs text-muted mb-0">{feat.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-10 left-6 h-32 w-32 rounded-full bg-sky/70 blur-3xl" />
            <div className="relative rounded-[32px] overflow-hidden border border-white/80 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/60 pointer-events-none" />
              <div className="relative pt-[108%] sm:pt-[120%]">
                {heroImage ? (
                  <img src={heroImage} alt={featuredProduct?.name || 'Товар'} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
                    Добавьте фото товара, чтобы показать его здесь
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:absolute sm:-bottom-6 sm:left-6 sm:right-6 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{featuredLabel}</p>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold mb-1">{featuredProduct?.name || 'Новый комплект'}</p>
                  {featuredPrice ? (
                    <p className="text-sm text-muted m-0">
                      от {featuredPrice.toLocaleString('ru-RU')} ₽
                    </p>
                  ) : (
                    <p className="text-sm text-muted m-0">В наличии любимые оттенки</p>
                  )}
                </div>
                <Link to={featuredProduct ? `/product/${featuredProduct.id}` : '/category/popular'} className="button-ghost text-primary">
                  Подробнее →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-10">
        <div className="grid gap-4 md:grid-cols-3">
          {trustMetrics.map((metric) => (
            <div key={metric.title} className="soft-card px-6 py-5">
              <p className="text-2xl font-semibold text-ink">{metric.title}</p>
              <p className="text-sm text-muted">{metric.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12">
        <div className="ambient-panel relative overflow-hidden rounded-3xl border border-white/70 bg-white/70 backdrop-blur-lg px-6 py-8 md:px-10 md:py-10 shadow-xl">
          <div className="absolute -top-16 right-6 h-32 w-32 rounded-full bg-primary/20 blur-3xl float-slow pointer-events-none" />
          <div className="absolute -bottom-16 left-6 h-32 w-32 rounded-full bg-sky/60 blur-3xl float-slow pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.32em] text-muted">Категории</p>
              <h2 className="text-2xl md:text-3xl font-semibold">Тихие подборки для уютного дома</h2>
              <p className="text-sm text-muted mt-2">
                Быстрый доступ к текстилю для спальни, ванной и детской — без лишнего шума.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/category/popular" className="button">В каталог</Link>
              <Link to="/category/new" className="button-gray">Новинки</Link>
            </div>
          </div>
          <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(topCategories || []).slice(0, 8).map((cat, idx) => {
              const accent = categoryAccents[idx % categoryAccents.length];
              const count = categoryMeta.counts[cat.id] || categoryMeta.counts[cat.slug] || 0;
              const countLabel = count ? `${count} товаров` : 'Подборка';
              const catKey = resolveCategoryKey(cat);
              const previewProduct = categoryMeta.heroMap[catKey];
              const previewImage = getPrimaryImageUrl(previewProduct);
              return (
                <Link
                  key={cat.slug || cat.id}
                  to={`/category/${cat.slug || cat.id}`}
                  className={`group relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br ${accent.gradient} p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl reveal-up`}
                  style={{ animationDelay: `${idx * 70}ms` }}
                >
                  <div
                    className={`absolute -top-10 -right-10 h-24 w-24 rounded-full ${accent.orb} blur-2xl opacity-70 transition group-hover:opacity-90`}
                  />
                  <div className="relative z-10 flex h-full flex-col gap-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted">
                      <span>Раздел</span>
                      <span className="tracking-normal normal-case">{countLabel}</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-white/70 bg-white/80">
                      <div className="relative pt-[68%]">
                        {previewImage ? (
                          <img src={previewImage} alt={cat.name} className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                            Фото появится позже
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-semibold mb-1">{cat.name}</p>
                      <p className="text-xs text-muted mb-0">
                        {cat.description || 'Текстиль и детали для вашего пространства.'}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center justify-between text-sm font-medium text-primary">
                      <span>Смотреть</span>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/80 shadow-sm transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
            {topCategories.length === 0 && (
              <p className="text-sm text-muted col-span-full">
                Категории появятся после добавления в админке.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-2xl font-semibold">Бестселлеры недели</h2>
          <Link to="/category/popular" className="text-primary text-sm">
            Смотреть все
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.slice(0, 8).map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
          {products.length === 0 && (
            <div className="text-sm text-muted">Добавьте товары в каталоге, чтобы показать их здесь.</div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="soft-card p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Комплект недели</p>
            <h3 className="text-2xl font-semibold mt-2">Соберите идеальную спальню за один клик</h3>
            <p className="text-sm text-muted mt-3 max-w-xl">
              Добавьте популярный комплект с наволочками и простынёй на резинке. Мы собрали
              оптимальные сочетания по цвету и фактуре.
            </p>
            <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
              {['Комплект простыней', 'Пододеяльник 200×220', '2 наволочки 50×70'].map((item) => (
                <div key={item} className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-3 text-center">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to={primaryCtaLink} className="button">Собрать комплект</Link>
              <Link to="/category/popular" className="button-gray">Подобрать самостоятельно</Link>
            </div>
          </div>
          <div className="soft-card p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Сезонные подборки</p>
            <div className="mt-4 space-y-4">
              {seasonalTiles.map((tile) => (
                <div key={tile.title} className="rounded-2xl border border-ink/10 bg-white/80 p-4">
                  <h4 className="text-lg font-semibold">{tile.title}</h4>
                  <p className="text-sm text-muted mt-1">{tile.subtitle}</p>
                  <Link to={tile.link} className="text-sm text-primary mt-2 inline-flex items-center gap-2">
                    {tile.cta} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white/80 border-y border-ink/10 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Новинки с мягким характером</h2>
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
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-2xl font-semibold">Коллекции</h2>
          <Link to="/category/collections" className="text-primary text-sm">
            Смотреть все
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {collections.map((coll) => (
            <div
              key={coll.title}
              className="rounded-3xl border border-ink/10 overflow-hidden bg-white/90 shadow-sm"
            >
              <div className="h-40 bg-gradient-to-br from-[#f3ebe3] to-[#e6d9cd]" />
              <div className="p-5 flex flex-col gap-2">
                <h4 className="font-semibold">{coll.title}</h4>
                <p className="text-sm text-muted flex-1">{coll.description}</p>
                <Link to="/category/collections" className="text-primary text-sm">
                  Смотреть коллекцию →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-2xl font-semibold">Отзывы</h2>
          <Link to="/about" className="text-primary text-sm">
            История бренда
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {reviews.map((rev, idx) => {
            const product = products.find((p) => p.id === rev.productId);
            return (
              <div
                key={idx}
                className="flex-shrink-0 w-72 bg-white/90 border border-ink/10 rounded-2xl overflow-hidden snap-start shadow-sm"
              >
                <div className="p-5 flex flex-col justify-between h-full">
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
        {featuredReview && (
          <div className="mt-6 rounded-3xl border border-ink/10 bg-white/90 p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.28em] text-muted">Слова наших клиентов</p>
            <p className="text-lg font-semibold mt-2">“{featuredReview.text}”</p>
            <p className="text-sm text-muted mt-2">— {featuredReview.author}</p>
          </div>
        )}
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="soft-card p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Постельное Белье‑Юг — пространство для отдыха и перезагрузки
            </h2>
            <p className="text-base text-muted mt-4">
              Собственное производство, проверенные материалы и честный сервис. Здесь легко подобрать комплект под
              стиль вашего дома: фильтры по категориям, брендам и готовые подборки облегчают выбор.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link to="/about" className="button">Подробнее о нас</Link>
              <Link to="/info/production" className="button-gray">О производстве</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
