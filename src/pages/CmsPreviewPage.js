import React from 'react';
import Seo from '../components/Seo';
import CmsPageRenderer from '../components/cms/CmsPageRenderer';
import { CampaignCard } from '../components/cms/blocks/CampaignSlotBlock';
import { Card } from '../components/ui';
import { useSsrData } from '../ssr/SsrDataContext';

function PreviewBanner({ creative }) {
  const campaign = {
    id: `preview-banner-${creative?.id || 'draft'}`,
    slug: 'preview',
    internalName: creative?.title || creative?.shortText || 'Баннер',
    creatives: creative ? [creative] : []
  };
  return <CampaignCard campaign={campaign} />;
}

function CmsPreviewPage() {
  const { routeData } = useSsrData();
  const target =
    routeData?.kind === 'cms-preview' && routeData.target
      ? routeData.target
      : null;

  if (!target) {
    return (
      <section className="page-shell page-section">
        <Seo
          title="Предпросмотр недоступен"
          description="Ссылка предпросмотра недействительна или истекла."
          canonicalPath="/__cms-preview/view"
          robots="noindex,nofollow"
        />
        <Card padding="lg" className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-semibold text-ink">Предпросмотр недоступен</h1>
          <p className="mt-3 text-muted">
            Вернитесь в Directus и откройте предпросмотр заново.
          </p>
        </Card>
      </section>
    );
  }

  const content = target.content;
  return (
    <>
      <Seo
        title="Предпросмотр Directus"
        description="Защищенный предпросмотр черновика Directus."
        canonicalPath="/__cms-preview/view"
        robots="noindex,nofollow"
      />
      <aside className="sticky top-0 z-[220] border-b border-amber-300 bg-amber-100 px-4 py-3 text-sm text-amber-950 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="m-0 font-semibold">
            Предпросмотр Directus · {target.collection} · версия {target.version || 'main'}
          </p>
          <a className="font-semibold underline" href="/__cms-preview/exit">
            Закрыть предпросмотр
          </a>
        </div>
      </aside>

      {target.collection === 'page' ? (
        <CmsPageRenderer page={{ ...content, robots: 'noindex,nofollow' }} />
      ) : (
        <section className="page-shell page-section">
          <div className="mx-auto max-w-5xl">
            {target.collection === 'campaign' ? (
              <CampaignCard campaign={content} />
            ) : (
              <PreviewBanner creative={content} />
            )}
          </div>
        </section>
      )}
    </>
  );
}

export default CmsPreviewPage;
