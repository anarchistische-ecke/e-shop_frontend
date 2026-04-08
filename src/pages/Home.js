import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import HomeCategoryNavigation from '../components/home/HomeCategoryNavigation';
import Seo from '../components/Seo';
import ProductCard from '../components/ProductCard';
import { Button, Card } from '../components/ui';
import { useProductDirectoryData } from '../features/product-list/data';
import { homeHeroDefaults } from '../data/homeHeroDefaults';
import { getPrimaryImageUrl, getProductPrice, resolveImageUrl } from '../utils/product';
import { buildProductPath } from '../utils/url';

function Home() {
  const { products, categories } = useProductDirectoryData();
  const [bannerText, setBannerText] = useState('');
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [heroConfig, setHeroConfig] = useState(() => ({ ...homeHeroDefaults }));

  useEffect(() => {
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

  const featuredProduct =
    visibleProducts.find((p) => p.id === heroConfig.featuredProductId) || visibleProducts[0] || null;
  const heroImage = getPrimaryImageUrl(featuredProduct);
  const heroShareImage = heroImage ? resolveImageUrl(heroImage) : '';
  const featuredPrice = featuredProduct ? getProductPrice(featuredProduct) : null;

  return (
    <>
      <Seo
        title="Домашний текстиль для уютного дома"
        description={`${heroSubtitle} Доставка по России, честные условия покупки и собственное производство.`}
        canonicalPath="/"
        image={heroShareImage}
      />
      <div className="home">
      {bannerText && bannerEnabled && (
        <div className="bg-ink text-white text-center py-2 px-4">
          <p className="text-sm">{bannerText}</p>
        </div>
      )}

      <section className="container mx-auto px-4 py-4 md:py-12">
        <div className="catalog-hero relative overflow-hidden rounded-[28px] border border-white/70 p-5 md:rounded-[32px] md:p-10 shadow-[0_24px_56px_rgba(43,39,34,0.14)]">
          <div className="absolute -top-20 right-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-6 h-40 w-40 rounded-full bg-sky/70 blur-3xl pointer-events-none" />
          <div className="relative z-10 grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div className="space-y-5 md:space-y-6">
              <p className="uppercase text-xs tracking-[0.4em] text-accent">{badgeText}</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
                {heroTitle} <span className="text-primary">{heroAccent}</span>
              </h1>
              <p className="text-sm sm:text-base text-muted max-w-xl">{heroSubtitle}</p>
              <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                <Button as={Link} to={primaryCtaLink} className="w-full sm:w-auto">
                  {primaryCtaLabel}
                </Button>
                <Button
                  as={Link}
                  to={secondaryCtaLink}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  {secondaryCtaLabel}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2 sm:gap-3">
                {heroHighlights.map((feat) => (
                  <Card
                    key={feat.title}
                    as={Link}
                    to={feat.link}
                    variant="quiet"
                    padding="sm"
                    interactive
                    className="rounded-2xl"
                    aria-label={feat.title}
                  >
                    <p className="text-sm font-semibold mb-1">{feat.title}</p>
                    <p className="text-xs text-muted mb-0">{feat.subtitle}</p>
                  </Card>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -bottom-10 left-6 h-32 w-32 rounded-full bg-sky/70 blur-3xl" />
              <div className="relative rounded-[30px] overflow-hidden border border-white/80 shadow-[0_30px_60px_rgba(43,39,34,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/60 pointer-events-none" />
                <div className="relative pt-[88%] sm:pt-[120%]">
                  {heroImage ? (
                    <img src={heroImage} alt={featuredProduct?.name || 'Товар'} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
                      Добавьте фото товара, чтобы показать его здесь
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/80 bg-white/92 p-4 shadow-[0_18px_40px_rgba(43,39,34,0.16)] backdrop-blur sm:absolute sm:-bottom-6 sm:left-6 sm:right-6 sm:mt-0">
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
                  <Button
                    as={Link}
                    to={featuredProduct ? buildProductPath(featuredProduct) : '/category/popular'}
                    variant="ghost"
                    size="sm"
                    className="text-primary"
                  >
                    Подробнее →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeCategoryNavigation categories={categories} products={visibleProducts} />

      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-2xl font-semibold">Бестселлеры недели</h2>
          <Button as={Link} to="/category/popular" variant="ghost" size="sm" className="self-start text-primary">
            Смотреть все
          </Button>
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
          <Card padding="lg">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Комплект недели</p>
            <h3 className="text-2xl font-semibold mt-2">Соберите идеальную спальню за один клик</h3>
            <p className="text-sm text-muted mt-3 max-w-xl">
              Добавьте популярный комплект с наволочками и простынёй на резинке. Мы собрали
              оптимальные сочетания по цвету и фактуре.
            </p>
            <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
              {['Комплект простыней', 'Пододеяльник 200×220', '2 наволочки 50×70'].map((item) => (
                <Card key={item} variant="quiet" padding="sm" className="rounded-2xl text-center">
                  {item}
                </Card>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button as={Link} to={primaryCtaLink}>Собрать комплект</Button>
              <Button as={Link} to="/category/popular" variant="secondary">Подобрать самостоятельно</Button>
            </div>
          </Card>
          <Card padding="lg">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Сезонные подборки</p>
            <div className="mt-4 space-y-4">
              {seasonalTiles.map((tile) => (
                <Card key={tile.title} variant="quiet" padding="sm" className="rounded-2xl">
                  <h4 className="text-lg font-semibold">{tile.title}</h4>
                  <p className="text-sm text-muted mt-1">{tile.subtitle}</p>
                  <Button as={Link} to={tile.link} variant="ghost" size="sm" className="mt-2 text-primary !px-0">
                    {tile.cta} →
                  </Button>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-white/75 border-y border-ink/10 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Новинки с мягким характером</h2>
            <Button as={Link} to="/category/new" variant="ghost" size="sm" className="self-start text-primary">
              Смотреть все
            </Button>
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
          <Card padding="lg" className="text-center">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Постельное Белье‑ЮГ — пространство для отдыха и перезагрузки
            </h2>
            <p className="text-base text-muted mt-4">
              Собственное производство, проверенные материалы и честный сервис. Здесь легко подобрать комплект под
              стиль вашего дома: фильтры по категориям, брендам и готовые подборки облегчают выбор.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button as={Link} to="/catalog">В каталог</Button>
              <Button as={Link} to="/info/production" variant="secondary">О производстве</Button>
            </div>
          </Card>
        </div>
      </section>
      </div>
    </>
  );
}

export default Home;
