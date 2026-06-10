import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import HeroBanner from '../components/home/HeroBanner';
import FeaturedProducts from '../components/home/FeaturedProducts';
import PromoBanners from '../components/home/PromoBanners';
import NewsletterForm from '../components/home/NewsletterForm';
import CmsManagedPage from '../components/cms/CmsManagedPage';
import ResponsiveImage from '../components/media/ResponsiveImage';
import { Button, Card } from '../components/ui';
import { getActivePromotions } from '../api';
import { useProductDirectoryData } from '../features/product-list/data';
import { homeHeroDefaults } from '../data/homeHeroDefaults';
import {
  getPrimaryImageMedia,
  getPrimaryImageUrl,
  getProductPrice,
  resolveImageUrl,
} from '../utils/product';
import { buildProductPath } from '../utils/url';

function getProductStock(product) {
  if (!product) return 0;
  if (product.stock !== undefined || product.stockQuantity !== undefined) {
    return Number(product.stock ?? product.stockQuantity ?? 0);
  }
  const variants = Array.isArray(product.variants)
    ? product.variants
    : Array.from(product.variants || []);
  return variants.reduce(
    (sum, variant) => sum + Number(variant?.stock ?? variant?.stockQuantity ?? 0),
    0
  );
}

const fabricGuideItems = [
  {
    title: 'Перкаль',
    label: 'Прохладная свежесть',
    description: 'Матовая хлопковая ткань для тех, кто любит прохладное, свежее ощущение.',
    cue: 'Лучше для теплого сна',
    cta: 'Смотреть перкаль',
    link: '/catalog?query=%D0%BF%D0%B5%D1%80%D0%BA%D0%B0%D0%BB%D1%8C',
    imageUrl:
      'https://images.unsplash.com/photo-1616627561839-074385245ff6?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Сатин',
    label: 'Гладко и мягко',
    description: 'Гладкая поверхность с мягким блеском, которая ощущается плотнее и теплее.',
    cue: 'Лучше для мягкости',
    cta: 'Смотреть сатин',
    link: '/catalog?query=%D1%81%D0%B0%D1%82%D0%B8%D0%BD',
    imageUrl:
      'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Лен',
    label: 'Живая фактура',
    description: 'Живая фактура, свободная посадка и ощущение спальни без лишней парадности.',
    cue: 'Лучше для фактуры',
    cta: 'Смотреть лен',
    link: '/catalog?query=%D0%BB%D0%B5%D0%BD',
    imageUrl:
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Готовый комплект',
    label: 'Готовое сочетание',
    description: 'Простыня, пододеяльник, наволочки и акценты в одной спокойной палитре.',
    cue: 'Лучше для быстрого выбора',
    cta: 'Собрать кровать',
    link: '/catalog?query=%D0%BA%D0%BE%D0%BC%D0%BF%D0%BB%D0%B5%D0%BA%D1%82',
    imageUrl:
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=900&q=80',
  },
];

const benefitItems = [
  {
    title: 'Доставка по России',
    description: 'Финальные условия и стоимость доставки видны до оплаты.',
  },
  {
    title: 'Возврат без скрытых условий',
    description: 'Сервисные правила доступны заранее в документах магазина.',
  },
  {
    title: 'Контроль ткани и пошива',
    description: 'Собственное производство помогает держать качество стабильным.',
  },
  {
    title: 'Оплата картой или СБП',
    description: 'Безопасная оплата без сохранения платёжных данных на сайте.',
  },
];

function SectionIntro({ eyebrow, title, description, actionLabel, actionUrl }) {
  return (
    <div className="section-header">
      <div className="section-header__copy">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.28em] text-accent">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
        {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
      </div>
      {actionLabel && actionUrl ? (
        <Button as={Link} to={actionUrl} variant="ghost" className="self-start text-primary">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function ShopByFeelSection() {
  return (
    <section className="page-shell page-section">
      <SectionIntro
        eyebrow="Найти свою ткань"
        title="Выберите по ощущению, а не по названию ткани"
        description="Короткие редакционные карточки объясняют разницу между перкалем, сатином, льном и готовыми комплектами без длинного перехода в справочник."
        actionLabel="Открыть каталог"
        actionUrl="/catalog"
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {fabricGuideItems.map((item) => (
          <Card
            key={item.title}
            variant="quiet"
            padding="sm"
            className="group h-full overflow-hidden rounded-[24px] border border-ink/10 bg-white/88"
          >
            <div className="overflow-hidden rounded-[20px] border border-ink/10 bg-sky/30">
              <div className="relative pt-[72%]">
                <ResponsiveImage
                  src={item.imageUrl}
                  alt={`${item.title}: фактура ткани`}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(min-width: 1280px) 23vw, (min-width: 640px) 46vw, 92vw"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="mt-4 flex min-h-[12rem] flex-col gap-2">
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                {item.label}
              </p>
              <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
              <p className="text-sm leading-6 text-muted">{item.description}</p>
              <p className="mt-auto text-xs font-semibold text-accent">{item.cue}</p>
              <Button as={Link} to={item.link} variant="secondary" size="sm" className="mt-1">
                {item.cta}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function BenefitsRow() {
  return (
    <section className="page-shell page-section--tight">
      <div className="grid gap-3 rounded-[28px] border border-[#d7e1dc] bg-[#f6f8f3] p-4 shadow-[0_18px_36px_rgba(43,39,34,0.08)] sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
        {benefitItems.map((item) => (
          <div key={item.title} className="rounded-2xl border border-ink/10 bg-white/86 p-4">
            <p className="text-sm font-semibold leading-5 text-ink">{item.title}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConversionCta() {
  return (
    <section className="page-shell page-section">
      <div className="overflow-hidden rounded-[30px] border border-primary/20 bg-[#fff8ef] px-5 py-6 shadow-[0_22px_48px_rgba(126,81,44,0.12)] sm:px-7 sm:py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Готовы выбрать</p>
          <h2 className="mt-3 text-3xl font-semibold text-ink">Соберите кровать из проверенных комплектов</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Начните с бестселлеров, добавьте плед или выберите ткань по ощущению. Финальная стоимость доставки и условия оплаты останутся видимыми до оформления заказа.
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:mt-0">
          <Button as={Link} to="/category/popular">
            Смотреть бестселлеры
          </Button>
          <Button as={Link} to="/catalog?query=%D0%BA%D0%BE%D0%BC%D0%BF%D0%BB%D0%B5%D0%BA%D1%82" variant="secondary">
            Собрать кровать
          </Button>
        </div>
      </div>
    </section>
  );
}

function HomeFallbackPage() {
  const { products, loading } = useProductDirectoryData();
  const heroConfig = homeHeroDefaults;
  const [activePromotions, setActivePromotions] = useState({ promotions: [], promoCodes: [] });

  useEffect(() => {
    let mounted = true;
    getActivePromotions()
      .then((data) => {
        if (!mounted) return;
        setActivePromotions({
          promotions: Array.isArray(data?.promotions) ? data.promotions : [],
          promoCodes: Array.isArray(data?.promoCodes) ? data.promoCodes : []
        });
      })
      .catch((err) => {
        console.warn('Failed to load active promotions', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const activeProducts = useMemo(
    () => products.filter((product) => product?.isActive !== false),
    [products]
  );

  const bestsellers = useMemo(() => {
    return [...activeProducts]
      .sort((a, b) => {
        const scoreA =
          Math.min(getProductStock(a), 12) * 10 +
          getProductPrice(a);
        const scoreB =
          Math.min(getProductStock(b), 12) * 10 +
          getProductPrice(b);
        return scoreB - scoreA;
      })
      .slice(0, 8);
  }, [activeProducts]);

  const featuredProduct = useMemo(() => {
    return (
      activeProducts.find((product) => product.id === heroConfig.featuredProductId) ||
      bestsellers[0] ||
      activeProducts[0] ||
      null
    );
  }, [activeProducts, bestsellers, heroConfig.featuredProductId]);

  const heroImage = getPrimaryImageUrl(featuredProduct);
  const heroImageMedia = getPrimaryImageMedia(featuredProduct);
  const heroShareImage = heroImage ? resolveImageUrl(heroImage) : '';

  const heroHighlights = [
    {
      title: 'Условия доставки',
      subtitle: 'Стоимость и способ доставки видны до оплаты.',
      link: '/info/delivery',
    },
    {
      title: 'Карта или СБП',
      subtitle: 'Безопасная оплата через платёжную форму.',
      link: '/info/payment',
    },
    {
      title: 'Ткань и пошив под контролем',
      subtitle: 'Собственное производство и понятные материалы.',
      link: '/info/production',
    },
    {
      title: 'Условия открыты заранее',
      subtitle: 'Документы, возврат и реквизиты доступны до заказа.',
      link: '/info/legal',
    },
  ];

  const formatMinorAmount = (amount, currency = 'RUB') => {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric)) return '';
    return `${(numeric / 100).toLocaleString('ru-RU')} ${currency}`;
  };

  const livePromoBanners = useMemo(() => {
    const promotionCards = activePromotions.promotions.slice(0, 2).map((promotion) => ({
      id: `promotion-${promotion.id}`,
      eyebrow: 'Акция',
      title: promotion.name,
      description:
        promotion.description ||
        (promotion.discountPercent
          ? `Скидка ${promotion.discountPercent}% применяется автоматически к товарам акции.`
          : promotion.discountAmount
          ? `Скидка ${formatMinorAmount(promotion.discountAmount, promotion.currency)} применяется автоматически.`
          : promotion.salePriceAmount
          ? `Акционная цена ${formatMinorAmount(promotion.salePriceAmount, promotion.currency)} применяется автоматически.`
          : 'Акционная цена применяется автоматически при оформлении заказа.'),
      cta: 'Смотреть каталог',
      link: '/catalog',
      secondaryCta: 'Условия оплаты',
      secondaryLink: '/info/payment',
      className: 'bg-gradient-to-br from-[#eaf2ec] via-white to-[#f4efe8]'
    }));
    const promoCodeCards = activePromotions.promoCodes.slice(0, Math.max(0, 2 - promotionCards.length)).map((promoCode) => ({
      id: `promo-code-${promoCode.id}`,
      eyebrow: 'Промокод',
      title: promoCode.code,
      description:
        promoCode.description ||
        (promoCode.discountPercent
          ? `Введите промокод в корзине, чтобы получить скидку ${promoCode.discountPercent}%.`
          : 'Введите промокод в корзине, чтобы применить скидку.'),
      cta: 'Открыть корзину',
      link: '/cart',
      secondaryCta: 'Все акции',
      secondaryLink: '/account#promocodes',
      className: 'bg-gradient-to-br from-[#edf4f6] via-white to-[#f7eee8]'
    }));
    return [...promotionCards, ...promoCodeCards];
  }, [activePromotions]);

  const featuredProductSummary = featuredProduct
    ? {
        name: featuredProduct.name,
        priceLabel: `${getProductPrice(featuredProduct).toLocaleString('ru-RU')} ₽`,
        link: buildProductPath(featuredProduct)
      }
    : null;

  return (
    <>
      <Seo
        title="Домашний текстиль для уютного дома"
        description={`${heroConfig.subtitle || homeHeroDefaults.subtitle} Доставка по России, честные условия покупки и собственное производство.`}
        canonicalPath="/"
        image={heroShareImage}
      />

      <div className="home">
        <HeroBanner
          imageUrl={heroImage}
          imageMedia={heroImageMedia}
          title={heroConfig.title || homeHeroDefaults.title}
          accent={heroConfig.accent || homeHeroDefaults.accent}
          description={heroConfig.subtitle || homeHeroDefaults.subtitle}
          badge={heroConfig.badge || homeHeroDefaults.badge}
          ctaText={heroConfig.primaryCtaLabel || homeHeroDefaults.primaryCtaLabel}
          ctaLink={heroConfig.primaryCtaLink || homeHeroDefaults.primaryCtaLink}
          secondaryCtaText={heroConfig.secondaryCtaLabel || homeHeroDefaults.secondaryCtaLabel}
          secondaryCtaLink={heroConfig.secondaryCtaLink || homeHeroDefaults.secondaryCtaLink}
          highlights={heroHighlights}
          featuredProduct={featuredProductSummary}
        />

        <FeaturedProducts
          eyebrow="С чего начать"
          title="Бестселлеры, которые быстро объясняют выбор"
          description="Четыре-восемь проверенных товаров с тканью, ценой и быстрым действием прямо на главной."
          products={bestsellers}
          loading={loading}
          ctaText="Все бестселлеры"
          ctaLink="/category/popular"
        />

        <PromoBanners banners={livePromoBanners} />

        <ShopByFeelSection />

        <BenefitsRow />

        <ConversionCta />

        <NewsletterForm />
      </div>
    </>
  );
}

function Home() {
  return <CmsManagedPage slug="home" fallback={<HomeFallbackPage />} />;
}

export default Home;
