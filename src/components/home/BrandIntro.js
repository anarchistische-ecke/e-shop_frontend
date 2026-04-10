import React from 'react';
import { Card } from '../ui';

function BrandIntro({ eyebrow, title, description, values = [] }) {
  return (
    <section className="page-shell page-section">
      <Card padding="lg" className="rounded-[32px]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.95fr)] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">{eyebrow}</p>
            <h2 className="mt-3 text-2xl font-semibold md:text-3xl">{title}</h2>
            <p className="mt-3 max-w-2xl text-base text-muted">{description}</p>
          </div>

          <div className="grid gap-3">
            {values.map((item) => (
              <Card key={item.title} variant="quiet" padding="sm" className="rounded-[24px]">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}

export default BrandIntro;
