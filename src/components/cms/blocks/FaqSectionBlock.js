import React from 'react';
import { Card } from '../../ui';
import {
  CmsRichText,
  CmsSectionActions,
  CmsSectionHeading,
  getSurfaceToneClass,
  looksLikeHtml,
} from '../cmsBlockShared';

function FaqAnswer({ answer }) {
  if (!answer) {
    return null;
  }

  if (looksLikeHtml(answer)) {
    return <CmsRichText html={answer} className="cms-faq-answer" />;
  }

  return <p className="m-0 text-sm leading-6 text-muted">{answer}</p>;
}

function FaqSectionBlock({ section }) {
  const items = Array.isArray(section.items) ? section.items : [];

  return (
    <section id={section.anchorId || undefined} className="space-y-4">
      <Card
        padding="lg"
        className={`space-y-5 rounded-[28px] ${getSurfaceToneClass(section.styleVariant)}`}
      >
        <CmsSectionHeading
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.body}
        />
        <CmsSectionActions section={section} />
      </Card>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <details
              key={`${item.title || 'faq'}-${index}`}
              className="cms-faq-item rounded-[24px] border border-ink/10 bg-white/88 px-5 py-4 shadow-[0_12px_24px_rgba(43,39,34,0.06)]"
            >
              <summary className="cms-faq-summary flex cursor-pointer list-none items-start justify-between gap-4 text-left">
                <span className="text-base font-semibold text-ink">{item.title || item.label || 'Вопрос'}</span>
                <span className="cms-faq-toggle mt-0.5 text-xl leading-none text-primary">+</span>
              </summary>
              <div className="pt-4">
                <FaqAnswer answer={item.description} />
              </div>
            </details>
          ))}
        </div>
      ) : (
        <Card padding="lg" className="rounded-[24px] border border-dashed border-ink/12 bg-white/74">
          <p className="m-0 text-sm leading-6 text-muted">
            Для этого FAQ-блока пока не привязаны вопросы. Как только редакторы добавят FAQ-элементы,
            они появятся здесь автоматически.
          </p>
        </Card>
      )}
    </section>
  );
}

export default FaqSectionBlock;
