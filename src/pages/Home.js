import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../api';
import { homeHeroDefaults } from '../data/homeHeroDefaults';
import { getPrimaryImageUrl, getProductPrice, resolveImageUrl } from '../utils/product';

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bannerText, setBannerText] = useState('');
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [heroConfig, setHeroConfig] = useState(() => ({ ...homeHeroDefaults }));
  const categoryRowRef = useRef(null);

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
      link: '/info/production',
    },
    {
      title: '14 дней на возврат',
      subtitle: 'Если что-то не подошло — оформим возврат по правилам.',
      link: '/usloviya-prodazhi#return',
    },
    {
      title: 'Бесплатная доставка от 5000 ₽',
      subtitle: 'Курьером или в пункт выдачи, без доплат.',
      link: '/info/delivery',
    },
    {
      title: 'Собственное производство',
      subtitle: 'Контроль качества на каждом этапе пошива.',
      link: '/info/production',
    },
  ];

  const visibleProducts = useMemo(
    () => products.filter((product) => product?.isActive !== false),
    [products]
  );


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

  const categoryAccents = [
    { gradient: 'from-[#f6f1ea] via-white to-[#efe4d7]', orb: 'bg-[#e2d2c1]' },
    { gradient: 'from-[#f4f1ea] via-white to-[#e8efe8]', orb: 'bg-[#d7e6db]' },
    { gradient: 'from-[#f7f2ec] via-white to-[#efe7de]', orb: 'bg-[#e6d5c4]' },
    { gradient: 'from-[#f2efe7] via-white to-[#e6ece5]', orb: 'bg-[#d2dfd5]' },
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
    visibleProducts.forEach((product) => {
      const key = resolveProductCategoryKey(product);
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
      if (!heroMap[key]) heroMap[key] = product;
    });
    return { counts, heroMap };
  }, [visibleProducts]);

  const featuredProduct =
    visibleProducts.find((p) => p.id === heroConfig.featuredProductId) || visibleProducts[0] || null;
  const heroImage = getPrimaryImageUrl(featuredProduct);
  const featuredPrice = featuredProduct ? getProductPrice(featuredProduct) : null;
  const topCategories = categories.filter((cat) => !cat.parentId);

  const resolveCategoryKey = (category) => {
    if (!category) return '';
    return String(category.slug || category.id || category.name || '');
  };

  const scrollCategories = (direction) => {
    const scroller = categoryRowRef.current;
    if (!scroller) return;
    const scrollAmount = Math.max(260, scroller.clientWidth * 0.75);
    scroller.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="home">
      {bannerText && bannerEnabled && (
        <div className="bg-ink text-white text-center py-2 px-4">
          <p className="text-sm">{bannerText}</p>
        </div>
      )}

      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="catalog-hero relative overflow-hidden rounded-[32px] border border-white/70 p-6 md:p-10 shadow-[0_30px_70px_rgba(43,39,34,0.14)]">
          <div className="absolute -top-20 right-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-6 h-40 w-40 rounded-full bg-sky/70 blur-3xl pointer-events-none" />
          <div className="relative z-10 grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-center">
            <div className="space-y-6">
              <p className="uppercase text-xs tracking-[0.4em] text-accent">{badgeText}</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
                {heroTitle} <span className="text-primary">{heroAccent}</span>
              </h1>
              <p className="text-sm sm:text-base text-muted max-w-xl">{heroSubtitle}</p>
              <div className="flex flex-wrap gap-3">
                <Link to={primaryCtaLink} className="button">{primaryCtaLabel}</Link>
                <Link to={secondaryCtaLink} className="button-gray">{secondaryCtaLabel}</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {heroHighlights.map((feat) => (
                  <Link
                    key={feat.title}
                    to={feat.link}
                    className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-[0_12px_24px_rgba(43,39,34,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(43,39,34,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    aria-label={feat.title}
                  >
                    <p className="text-sm font-semibold mb-1">{feat.title}</p>
                    <p className="text-xs text-muted mb-0">{feat.subtitle}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -bottom-10 left-6 h-32 w-32 rounded-full bg-sky/70 blur-3xl" />
              <div className="relative rounded-[30px] overflow-hidden border border-white/80 shadow-[0_30px_60px_rgba(43,39,34,0.2)]">
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
              <div className="mt-4 sm:mt-0 sm:absolute sm:-bottom-6 sm:left-6 sm:right-6 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_rgba(43,39,34,0.16)] backdrop-blur">
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
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12">
        <div className="ambient-panel relative overflow-hidden rounded-[28px] border border-white/70 bg-white/70 backdrop-blur-lg px-6 py-8 md:px-10 md:py-10 shadow-[0_24px_60px_rgba(43,39,34,0.12)]">
          <div className="absolute -top-16 right-6 h-32 w-32 rounded-full bg-primary/20 blur-3xl float-slow pointer-events-none" />
          <div className="absolute -bottom-16 left-6 h-32 w-32 rounded-full bg-sky/60 blur-3xl float-slow pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.32em] text-accent">Категории</p>
              <h2 className="text-2xl md:text-3xl font-semibold">Тихие подборки для уютного дома</h2>
              <p className="text-sm text-muted mt-2">
                Быстрый доступ к текстилю для спальни, ванной и детской — без лишнего шума.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/catalog" className="button">В каталог</Link>
              <Link to="/category/new" className="button-gray">Новинки</Link>
            </div>
          </div>
          <div className="relative z-10 mt-6">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white/90 via-white/50 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white/90 via-white/50 to-transparent" />
              <div
                id="category-carousel"
                ref={categoryRowRef}
                className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scroll-smooth scrollbar-hide cursor-grab active:cursor-grabbing"
              >
                {(topCategories || []).map((cat, idx) => {
                  const accent = categoryAccents[idx % categoryAccents.length];
                  const count = categoryMeta.counts[cat.id] || categoryMeta.counts[cat.slug] || 0;
                  const countLabel = count ? `${count} товаров` : 'Подборка';
                  const catKey = resolveCategoryKey(cat);
                  const previewProduct = categoryMeta.heroMap[catKey];
                  const categoryImage = resolveImageUrl(
                    cat.imageUrl || cat.image || cat.image_url || cat.thumbnail || ''
                  );
                  const previewImage = getPrimaryImageUrl(previewProduct);
                  const tileImage = categoryImage || previewImage;
                  return (
                    <Link
                      key={cat.slug || cat.id}
                      to={`/category/${cat.slug || cat.id}`}
                      className={`group relative flex-shrink-0 w-[260px] sm:w-[300px] lg:w-[320px] snap-start overflow-hidden rounded-[24px] border border-white/70 bg-gradient-to-br ${accent.gradient} p-4 shadow-[0_16px_36px_rgba(43,39,34,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_45px_rgba(43,39,34,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 reveal-up`}
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
                        <div className="rounded-2xl overflow-hidden border border-white/70 bg-white/85">
                          <div className="relative pt-[68%]">
                            {tileImage ? (
                              <img src={tileImage} alt={cat.name} className="absolute inset-0 h-full w-full object-cover" />
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
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/70 bg-white/85 shadow-sm transition-transform duration-300 group-hover:translate-x-1">
                            →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {topCategories.length === 0 && (
                  <p className="text-sm text-muted">
                    Категории появятся после добавления в админке.
                  </p>
                )}
              </div>
              {topCategories.length > 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => scrollCategories(-1)}
                    className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-ink shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    aria-label="Прокрутить категории влево"
                    aria-controls="category-carousel"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCategories(1)}
                    className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-ink shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    aria-label="Прокрутить категории вправо"
                    aria-controls="category-carousel"
                  >
                    →
                  </button>
                </>
              )}
            </div>
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
          {visibleProducts.slice(0, 8).map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
          {visibleProducts.length === 0 && (
            <div className="text-sm text-muted">Добавьте товары в каталоге, чтобы показать их здесь.</div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="soft-card p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Комплект недели</p>
            <h3 className="text-2xl font-semibold mt-2">Соберите идеальную спальню за один клик</h3>
            <p className="text-sm text-muted mt-3 max-w-xl">
              Добавьте популярный комплект с наволочками и простынёй на резинке. Мы собрали
              оптимальные сочетания по цвету и фактуре.
            </p>
            <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
              {['Комплект простыней', 'Пододеяльник 200×220', '2 наволочки 50×70'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/70 bg-white/85 px-3 py-3 text-center shadow-sm">
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
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Сезонные подборки</p>
            <div className="mt-4 space-y-4">
              {seasonalTiles.map((tile) => (
                <div key={tile.title} className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
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

      <section className="bg-white/75 border-y border-ink/10 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Новинки с мягким характером</h2>
            <Link to="/category/new" className="text-primary text-sm">
              Смотреть все
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleProducts.slice(0, 4).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
            {visibleProducts.length === 0 && (
              <div className="col-span-full text-sm text-muted">Новинки появятся после добавления товаров.</div>
            )}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="soft-card p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Постельное Белье‑ЮГ — пространство для отдыха и перезагрузки
            </h2>
            <p className="text-base text-muted mt-4">
              Собственное производство, проверенные материалы и честный сервис. Здесь легко подобрать комплект под
              стиль вашего дома: фильтры по категориям, брендам и готовые подборки облегчают выбор.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link to="/catalog" className="button">В каталог</Link>
              <Link to="/info/production" className="button-gray">О производстве</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
