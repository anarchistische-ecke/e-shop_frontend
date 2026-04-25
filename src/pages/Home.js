import React, { useEffect, useMemo, useState } from 'react';
import Seo from '../components/Seo';
import HeroBanner from '../components/home/HeroBanner';
import CategoryGrid from '../components/home/CategoryGrid';
import FeaturedProducts from '../components/home/FeaturedProducts';
import PromoBanners from '../components/home/PromoBanners';
import ShopTheLook from '../components/home/ShopTheLook';
import BrandIntro from '../components/home/BrandIntro';
import NewsletterForm from '../components/home/NewsletterForm';
import { getActivePromotions } from '../api';
import { useProductDirectoryData } from '../features/product-list/data';
import { homeHeroDefaults } from '../data/homeHeroDefaults';
import { getPrimaryImageUrl, getProductPrice, resolveImageUrl } from '../utils/product';
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

function Home() {
  const { products, categories, loading } = useProductDirectoryData();
  const [bannerText, setBannerText] = useState('');
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [heroConfig, setHeroConfig] = useState(() => ({ ...homeHeroDefaults }));
  const [activePromotions, setActivePromotions] = useState({ promotions: [], promoCodes: [] });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedBanner = localStorage.getItem('adminBanner');
    setBannerText(storedBanner || '');
    const enabled = localStorage.getItem('adminBannerEnabled');
    setBannerEnabled(enabled === null ? true : enabled === 'true');

    const storedHero = localStorage.getItem('homeHeroConfig');
    if (!storedHero) {
      return;
    }

    try {
      const parsed = JSON.parse(storedHero);
      setHeroConfig({ ...homeHeroDefaults, ...parsed });
    } catch (err) {
      console.error('Failed to parse home hero config', err);
      setHeroConfig({ ...homeHeroDefaults });
    }
  }, []);

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
          (Number(a.rating) || 0) * 100 +
          (Number(a.reviewCount || a.reviewsCount) || 0) * 4 +
          Math.min(getProductStock(a), 12);
        const scoreB =
          (Number(b.rating) || 0) * 100 +
          (Number(b.reviewCount || b.reviewsCount) || 0) * 4 +
          Math.min(getProductStock(b), 12);
        return scoreB - scoreA;
      })
      .slice(0, 8);
  }, [activeProducts]);

  const newArrivals = useMemo(() => {
    return [...activeProducts]
      .sort((a, b) => {
        const aIsNew = String(a.category || '').toLowerCase().includes('new') ? 1 : 0;
        const bIsNew = String(b.category || '').toLowerCase().includes('new') ? 1 : 0;
        if (aIsNew !== bIsNew) {
          return bIsNew - aIsNew;
        }
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
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
  const heroShareImage = heroImage ? resolveImageUrl(heroImage) : '';

  const heroHighlights = [
    {
      title: 'Доставка и возврат без сюрпризов',
      subtitle: 'Варианты доставки и финальную стоимость согласует менеджер.',
      link: '/info/delivery',
    },
    {
      title: 'Безопасная оплата',
      subtitle: 'Защищённый checkout и подтверждение заказа до списания.',
      link: '/info/payment',
    },
    {
      title: 'Собственное производство',
      subtitle: 'Контроль ткани, пошива и финальной упаковки.',
      link: '/info/production',
    },
    {
      title: 'Документы и прозрачные условия',
      subtitle: 'Оферта, политика данных и реквизиты доступны заранее.',
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

  const shopTheLookProducts = useMemo(() => {
    const ordered = [featuredProduct, ...bestsellers].filter(Boolean);
    const seen = new Set();
    return ordered.filter((product) => {
      if (!product?.id || seen.has(product.id)) {
        return false;
      }
      seen.add(product.id);
      return true;
    });
  }, [bestsellers, featuredProduct]);

  const brandValues = [
    {
      title: 'Ткани, которые хочется трогать',
      description: 'Отбираем мягкие, понятные по уходу материалы для реальной повседневной жизни.'
    },
    {
      title: 'Честный сервис до оплаты',
      description: 'Стоимость, доставка и правила возврата видны заранее, без неприятных сюрпризов.'
    },
    {
      title: 'Коллекции, которые легко сочетать',
      description: 'Подбираем цвета и фактуры так, чтобы покупка не конфликтовала с уже любимым текстилем.'
    }
  ];

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
        {bannerText && bannerEnabled ? (
          <div className="bg-ink text-white text-center py-2 px-4">
            <p className="text-sm">{bannerText}</p>
          </div>
        ) : null}

        <HeroBanner
          imageUrl={heroImage}
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

        <CategoryGrid categories={categories} products={activeProducts} />

        <FeaturedProducts
          eyebrow="Бестселлеры"
          title="Бестселлеры недели"
          description="Товары, которые покупают чаще всего: с хорошим рейтингом, понятной ценой и быстрым входом в оформление."
          products={bestsellers}
          loading={loading}
          ctaText="Смотреть подборку"
          ctaLink="/category/popular"
        />

        <PromoBanners banners={livePromoBanners} />

        <ShopTheLook
          title="Посмотрите на композицию и откройте товар прямо из сцены"
          description="Нажмите на точки интереса, чтобы быстро перейти к товару и собрать мягкий, спокойный интерьер без долгого поиска."
          imageUrl={heroImage}
          products={shopTheLookProducts}
        />

        <FeaturedProducts
          eyebrow="Новые поступления"
          title="Новинки с мягким характером"
          description="Свежие позиции, которые уже готовы к заказу и хорошо дополняют базовые комплекты."
          products={newArrivals}
          loading={loading}
          ctaText="Все новинки"
          ctaLink="/category/new"
        />

        <BrandIntro
          eyebrow="О бренде"
          title="Постельное Белье-ЮГ — магазин для спокойного домашнего выбора"
          description="Мы строим витрину вокруг реальных сценариев: быстро найти нужную категорию, понять условия до оплаты и выбрать текстиль, который легко впишется в дом. Никакой визуальной суеты и лишних шагов между желанием и покупкой."
          values={brandValues}
        />

        <NewsletterForm />
      </div>
    </>
  );
}

export default Home;
