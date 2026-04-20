import React from 'react';
import CmsPageRenderer from './CmsPageRenderer';
import { useCmsPage } from '../../contexts/CmsContentContext';
import { Card } from '../ui';

function CmsPageUnavailableState() {
  return (
    <section className="py-10 sm:py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <Card padding="lg" className="space-y-3 text-center">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.28em] text-muted">
            Контент недоступен
          </p>
          <h1 className="text-2xl font-semibold text-ink">Страница временно недоступна</h1>
          <p className="m-0 text-sm leading-6 text-muted">
            Попробуйте обновить страницу немного позже.
          </p>
        </Card>
      </div>
    </section>
  );
}

function CmsManagedPage({ slug, fallback = null, preview = false }) {
  const { page, isPageLoading } = useCmsPage(slug, { preview });

  if (page) {
    return <CmsPageRenderer page={page} />;
  }

  if (isPageLoading) {
    return (
      <section className="py-10 sm:py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <Card padding="lg" className="space-y-3 rounded-[28px] border border-ink/10 bg-white/82">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.28em] text-muted">
              Загружаем контент
            </p>
            <div className="h-8 w-2/3 animate-pulse rounded-full bg-[#e9dfd5]" />
            <div className="space-y-2 pt-2">
              <div className="h-4 animate-pulse rounded-full bg-[#efe7de]" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-[#efe7de]" />
              <div className="h-4 w-4/6 animate-pulse rounded-full bg-[#efe7de]" />
            </div>
          </Card>
        </div>
      </section>
    );
  }

  if (fallback) {
    return fallback;
  }

  return <CmsPageUnavailableState />;
}

export default CmsManagedPage;
