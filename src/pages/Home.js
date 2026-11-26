import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import HeroBanner, { HOME_HERO_FALLBACK_IMAGE } from '../components/home/HeroBanner';
import FeaturedProducts from '../components/home/FeaturedProducts';
import PromoBanners from '../components/home/PromoBanners';
import NewsletterForm from '../components/home/NewsletterForm';
import CmsManagedPage from '../components/cms/CmsManagedPage';
import { getCmsCampaigns } from '../api';
import { DEFAULT_CMS_SITE_SETTINGS } from '../data/cms/defaults';
import { homeHeroDefaults } from '../data/homeHeroDefaults';
import { useProductDirectoryData } from '../features/product-list/data';
import { buildCategoryCollections, resolveCategoryToken } from '../features/product-list/selectors';
import { buildCatalogSearchHref } from '../features/product-list/url';
import { buildJsonLdGraph, buildOrganizationJsonLd, buildWebPageJsonLd, buildWebSiteJsonLd } from '../seo/schema';
import { DELIVERY_SHORT_DISCLOSURE } from '../utils/delivery';
import { useSsrData } from '../ssr/SsrDataContext';
import { promotionFactLabel } from '../components/cms/blocks/CampaignSlotBlock';

const serviceItems = [
  { title: 'Доставка по России', description: DELIVERY_SHORT_DISCLOSURE, url: '/info/delivery' },
  { title: 'Оплата картой и СБП', description: 'Онлайн-оплата через платёжную форму.', url: '/info/payment' },
  { title: 'Условия возврата', description: 'Сроки и порядок возврата товара.', url: '/usloviya-prodazhi#return' },
];

const fabrics = [
  ['Перкаль', 'Матовая и гладкая фактура'],
  ['Сатин', 'Мягкая ткань с лёгким блеском'],
  ['Лён', 'Выраженная натуральная фактура'],
];

function HomeFallbackPage() {
  const { categories, products, loading } = useProductDirectoryData();
  const { routeData } = useSsrData();
  const hero = homeHeroDefaults;
  const seededCampaigns =
    routeData?.kind === 'home-marketing' && Array.isArray(routeData.campaigns) ? routeData.campaigns : [];
  const [campaigns, setCampaigns] = useState(seededCampaigns);

  useEffect(() => {
    if (seededCampaigns.length > 0) return undefined;
    let mounted = true;
    getCmsCampaigns({ placement: 'home_promo', limit: 2 })
      .then((data) => {
        if (mounted) setCampaigns(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.warn('Failed to load CMS campaigns', error));
    return () => { mounted = false; };
  }, [seededCampaigns.length]);

  const navCategories = useMemo(() => buildCategoryCollections(categories).navCategories.slice(0, 5), [categories]);
  const featuredProducts = useMemo(
    () => products.filter((product) => product?.isActive !== false).slice(0, 4),
    [products]
  );

  const seoTitle = 'Домашний текстиль для уютного дома';
  const homeJsonLd = useMemo(
    () => buildJsonLdGraph([
      buildOrganizationJsonLd({ siteSettings: DEFAULT_CMS_SITE_SETTINGS }),
      buildWebSiteJsonLd({ siteSettings: DEFAULT_CMS_SITE_SETTINGS }),
      buildWebPageJsonLd({
        title: seoTitle,
        description: hero.subtitle,
        path: '/',
        image: HOME_HERO_FALLBACK_IMAGE,
        siteSettings: DEFAULT_CMS_SITE_SETTINGS
      })
    ]),
    [hero.subtitle]
  );
  const livePromoBanners = useMemo(() => campaigns.slice(0, 2).map((campaign) => {
    const creative = Array.isArray(campaign.creatives) ? campaign.creatives[0] : null;
    return {
      id: `campaign-${campaign.id}`,
      eyebrow: creative?.eyebrow,
      title: creative?.title || creative?.shortText || campaign.internalName,
      description: creative?.description
        ? creative.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        : promotionFactLabel(campaign.promotion),
      cta: creative?.primaryCtaLabel || 'Подробнее',
      link: creative?.primaryCtaUrl || campaign.landingPage?.path || `/promo/${campaign.slug}`,
      secondaryCta: creative?.secondaryCtaLabel,
      secondaryLink: creative?.secondaryCtaUrl,
    };
  }), [campaigns]);

  return (
    <>
      <Seo
        title={seoTitle}
        description={hero.subtitle}
        canonicalPath="/"
        image={HOME_HERO_FALLBACK_IMAGE}
        imageAlt="Спальня с постельным бельём в натуральных оттенках"
        jsonLd={homeJsonLd}
      />

      <div className="home page-shell space-y-5 pb-10 pt-3 sm:space-y-8 sm:pt-5">
        <HeroBanner
          title={hero.title}
          accent={hero.accent}
          description={hero.subtitle}
          ctaText={hero.primaryCtaLabel}
          ctaLink={hero.primaryCtaLink}
        />

        {navCategories.length ? (
          <nav aria-label="Разделы каталога" className="flex gap-4 overflow-x-auto border-b border-ink/10 scrollbar-hide sm:gap-7">
            {navCategories.map((category) => {
              const token = resolveCategoryToken(category);
              return (
                <Link key={token} to={`/category/${token}`} className="focus-ring-soft flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary hover:underline">
                  {category.name}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <FeaturedProducts
          title="Текстиль для дома"
          products={featuredProducts}
          loading={loading}
          ctaText="Весь каталог"
          ctaLink="/catalog"
        />

        <PromoBanners banners={livePromoBanners} />

        <section className="border-t border-ink/10 pt-6">
          <h2 className="font-display text-2xl font-medium sm:text-3xl">Ткани и фактуры</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {fabrics.map(([name, description]) => (
              <li key={name}>
                <Link
                  to={buildCatalogSearchHref({ query: name.replace('ё', 'е') })}
                  className="focus-ring-soft flex min-h-16 flex-col justify-center gap-1 rounded-lg border border-ink/10 bg-white px-4 py-2 hover:border-primary/50"
                >
                  <span className="font-semibold text-primary">{name} <span aria-hidden="true">↗</span></span>
                  <span className="text-sm text-muted">{description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Условия покупки" className="grid gap-4 border-y border-ink/10 py-5 sm:grid-cols-3">
          {serviceItems.map((item) => (
            <div key={item.title}>
              <Link to={item.url} className="focus-ring-soft inline-flex min-h-[44px] items-center text-sm font-semibold text-primary underline underline-offset-4">{item.title}</Link>
              <p className="text-sm text-muted">{item.description}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

function Home() {
  return (
    <>
      <CmsManagedPage slug="home" fallback={<HomeFallbackPage />} />
      <NewsletterForm />
    </>
  );
}

export default Home;
