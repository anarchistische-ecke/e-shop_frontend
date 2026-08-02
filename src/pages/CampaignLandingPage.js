import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Seo from '../components/Seo';
import { Card } from '../components/ui';
import { CampaignCard } from '../components/cms/blocks/CampaignSlotBlock';
import { getCmsCampaign } from '../api';
import { useSsrData } from '../ssr/SsrDataContext';

function CampaignLandingPage() {
  const { slug } = useParams();
  const { routeData } = useSsrData();
  const seededCampaign =
    routeData?.kind === 'campaign' && routeData.slug === slug
      ? routeData.campaign
      : null;
  const [campaign, setCampaign] = useState(seededCampaign);
  const [loading, setLoading] = useState(!seededCampaign);

  useEffect(() => {
    if (seededCampaign || !slug) return undefined;
    let mounted = true;
    getCmsCampaign(slug)
      .then((payload) => {
        if (mounted) setCampaign(payload);
      })
      .catch(() => {
        if (mounted) setCampaign(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [seededCampaign, slug]);

  const creative = Array.isArray(campaign?.creatives) ? campaign.creatives[0] : null;
  const title = creative?.title || creative?.shortText || campaign?.internalName || 'Акция';
  const description = String(creative?.description || campaign?.promotion?.description || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!campaign && !loading) {
    return (
      <section className="page-shell page-section">
        <Seo
          title="Акция завершена"
          description="Эта акция завершена или пока недоступна."
          canonicalPath={`/promo/${slug || ''}`}
          robots="noindex,follow"
        />
        <Card padding="lg" className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-semibold text-ink">Акция завершена</h1>
          <p className="mt-3 text-muted">Актуальные предложения доступны в каталоге.</p>
        </Card>
      </section>
    );
  }

  return (
    <section className="page-shell page-section">
      <Seo
        title={title}
        description={description || 'Актуальная акция интернет-магазина.'}
        canonicalPath={`/promo/${campaign?.slug || slug || ''}`}
        image={creative?.image?.url || creative?.mobileImage?.url || ''}
        imageAlt={creative?.image?.alt || title}
      />
      {campaign ? (
        <div className="mx-auto max-w-5xl">
          <CampaignCard campaign={campaign} />
        </div>
      ) : (
        <Card padding="lg" className="mx-auto max-w-3xl text-center text-muted">
          Загружаем акцию…
        </Card>
      )}
    </section>
  );
}

export default CampaignLandingPage;
