import React from 'react';
import { Card } from '../../ui';
import CmsImage from '../CmsImage';
import {
  CmsAction,
  CmsRichText,
  CmsSectionHeading,
  getSurfaceToneClass,
} from '../cmsBlockShared';

function formatMoney(minor, currency = 'RUB') {
  if (!Number.isFinite(Number(minor))) return '';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency || 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(minor) / 100);
}

export function promotionFactLabel(facts) {
  if (!facts) return '';
  if (facts.discountPercent) return `Скидка ${facts.discountPercent}%`;
  if (facts.discountAmount) return `Скидка ${formatMoney(facts.discountAmount, facts.currency)}`;
  if (facts.salePriceAmount) return `Цена ${formatMoney(facts.salePriceAmount, facts.currency)}`;
  if (facts.code) return `Промокод ${facts.code}`;
  return facts.name || '';
}

function CampaignCard({ campaign }) {
  const creative = Array.isArray(campaign?.creatives) ? campaign.creatives[0] : null;
  if (!creative) return null;
  const promotionLabel = promotionFactLabel(campaign.promotion);
  const primaryUrl =
    creative.primaryCtaUrl ||
    campaign.landingPage?.path ||
    `/promo/${encodeURIComponent(campaign.slug)}`;

  return (
    <Card
      padding="none"
      className={`overflow-hidden rounded-[28px] ${getSurfaceToneClass(creative.styleVariant)}`}
      data-testid="cms-campaign-card"
    >
      {(creative.image || creative.mobileImage) ? (
        <CmsImage
          media={creative.image}
          mobileMedia={creative.mobileImage}
          alt={creative.image?.alt || creative.mobileImage?.alt || creative.title || campaign.internalName}
          frameClassName="aspect-[16/8]"
          sizes="(min-width: 1024px) 42rem, 92vw"
          preserveAspectRatio={false}
        />
      ) : null}
      <div className="space-y-4 p-5 sm:p-6">
        {creative.eyebrow ? (
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            {creative.eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-ink">
            {creative.title || creative.shortText || campaign.internalName}
          </h3>
          <CmsRichText html={creative.description} className="text-sm leading-6 text-muted" />
        </div>
        {promotionLabel ? (
          <p className="inline-flex rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
            {promotionLabel}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <CmsAction label={creative.primaryCtaLabel || 'Подробнее'} url={primaryUrl} />
          <CmsAction
            label={creative.secondaryCtaLabel}
            url={creative.secondaryCtaUrl}
            variant="secondary"
          />
        </div>
      </div>
    </Card>
  );
}

function CampaignSlotBlock({ section }) {
  const campaigns = Array.isArray(section?.campaigns) ? section.campaigns : [];
  if (!campaigns.length) return null;

  return (
    <section id={section.anchorId || undefined} className="space-y-5" data-testid="cms-campaign-slot">
      <CmsSectionHeading
        eyebrow={section.eyebrow}
        title={section.title}
        description={section.body}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id || campaign.slug} campaign={campaign} />
        ))}
      </div>
    </section>
  );
}

export { CampaignCard };
export default CampaignSlotBlock;
