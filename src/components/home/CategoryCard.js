import React from 'react';
import { Link } from 'react-router-dom';
import CategoryGlyph from '../navigation/CategoryGlyph';
import { Card } from '../ui';

function CategoryCard({ href, imageUrl, name, description, helperText, category }) {
  return (
    <Card
      as={Link}
      to={href}
      aria-label={name}
      variant="quiet"
      padding="sm"
      interactive
      className="group h-full rounded-[24px] border border-white/80 bg-white/88"
    >
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ink/10 bg-sand/35 text-ink/80 shadow-[0_8px_18px_rgba(43,39,34,0.06)]">
            <CategoryGlyph category={category} className="h-5 w-5" />
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
            Категория
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[22px] border border-ink/10 bg-sand/35">
          <div className="relative pt-[70%]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                Фото раздела появится позже
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold text-ink">{name}</h3>
          {helperText ? (
            <p className="text-xs uppercase tracking-[0.14em] text-primary/85">{helperText}</p>
          ) : null}
          {description ? (
            <p className="text-sm text-muted">{description}</p>
          ) : null}
        </div>

        <span className="mt-auto inline-flex items-center text-sm font-medium text-primary">
          Открыть раздел →
        </span>
      </div>
    </Card>
  );
}

export default CategoryCard;
