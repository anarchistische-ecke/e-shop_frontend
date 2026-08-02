import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../ui';
import { CmsSectionHeading } from '../cmsBlockShared';

function LegalDocumentListBlock({ section }) {
  const documents = Array.isArray(section?.legalDocuments) ? section.legalDocuments : [];
  if (!documents.length) return null;

  return (
    <section id={section.anchorId || undefined} className="space-y-5">
      <CmsSectionHeading
        eyebrow={section.eyebrow}
        title={section.title}
        description={section.body}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {documents.map((document) => (
          <Card
            as={Link}
            key={document.key || document.slug}
            to={document.path || `/legal/${document.slug}`}
            interactive
            padding="lg"
            className="rounded-[24px]"
          >
            <h3 className="text-lg font-semibold text-ink">{document.title}</h3>
            {document.summary ? (
              <p className="mt-2 text-sm leading-6 text-muted">{document.summary}</p>
            ) : null}
            <span className="mt-4 inline-flex text-sm font-semibold text-primary">
              Открыть документ →
            </span>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default LegalDocumentListBlock;
