import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../ui';
import { getPrimaryImageUrl, getProductPrice } from '../../utils/product';
import { buildProductPath } from '../../utils/url';

function ShopTheLook({ title, description, imageUrl, products = [] }) {
  const hotspots = useMemo(
    () =>
      products.slice(0, 3).map((product, index) => {
        const positions = [
          { top: '28%', left: '26%' },
          { top: '58%', left: '52%' },
          { top: '36%', left: '78%' }
        ];
        return {
          id: product.id,
          product,
          ...positions[index]
        };
      }),
    [products]
  );
  const [activeHotspotId, setActiveHotspotId] = useState(hotspots[0]?.id || '');

  useEffect(() => {
    setActiveHotspotId(hotspots[0]?.id || '');
  }, [hotspots]);

  const activeHotspot =
    hotspots.find((item) => item.id === activeHotspotId) || hotspots[0] || null;
  const fallbackImage =
    imageUrl || getPrimaryImageUrl(activeHotspot?.product) || getPrimaryImageUrl(products[0]);

  if (!activeHotspot) {
    return null;
  }

  return (
    <section className="page-shell page-section">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Shop the look</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>

          <div className="mt-5 overflow-hidden rounded-[30px] border border-white/80 bg-white/70 shadow-[0_24px_56px_rgba(43,39,34,0.12)]">
            <div className="relative pt-[112%] sm:pt-[78%]">
              {fallbackImage ? (
                <img
                  src={fallbackImage}
                  alt="Композиция интерьера с товарами магазина"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm text-muted">
                  Изображение лука появится после загрузки каталога
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-black/10" />

              {hotspots.map((hotspot, index) => {
                const isActive = hotspot.id === activeHotspot.id;
                return (
                  <button
                    key={hotspot.id}
                    type="button"
                    className={`touch-target absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white text-sm font-semibold shadow-[0_10px_24px_rgba(43,39,34,0.2)] transition ${
                      isActive
                        ? 'h-11 w-11 bg-primary text-white'
                        : 'h-11 w-11 bg-white/92 text-primary'
                    }`}
                    style={{ top: hotspot.top, left: hotspot.left }}
                    onClick={() => setActiveHotspotId(hotspot.id)}
                    aria-label={`Показать товар ${index + 1}: ${hotspot.product.name}`}
                    aria-pressed={isActive}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <Card padding="lg" className="rounded-[28px]">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Точка внимания</p>
          <h3 className="mt-3 text-2xl font-semibold text-ink">{activeHotspot.product.name}</h3>
          <p className="mt-2 text-sm text-muted">
            {activeHotspot.product.description || 'Откройте товар и добавьте его в корзину.'}
          </p>

          <div className="mt-5 rounded-[24px] border border-ink/10 bg-white/88 p-4">
            <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4">
              <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand/35">
                <div className="relative pt-[100%]">
                  {getPrimaryImageUrl(activeHotspot.product) ? (
                    <img
                      src={getPrimaryImageUrl(activeHotspot.product)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-ink">
                  {activeHotspot.product.name}
                </p>
                <p className="mt-1 text-sm text-muted">
                  от {getProductPrice(activeHotspot.product).toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button as={Link} to={buildProductPath(activeHotspot.product)}>
              Смотреть товар
            </Button>
            <Button as={Link} to="/category/popular" variant="secondary">
              Смотреть подборку
            </Button>
          </div>

          <div className="mt-6 grid gap-2">
            {hotspots.map((hotspot, index) => (
              <button
                key={`${hotspot.id}-list`}
                type="button"
                onClick={() => setActiveHotspotId(hotspot.id)}
                className={`focus-ring-soft grid min-h-[52px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition ${
                  hotspot.id === activeHotspot.id
                    ? 'border-primary/35 bg-primary/8 text-primary'
                    : 'border-ink/10 bg-white/88 text-ink hover:border-primary/25'
                }`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sand/55 text-sm font-semibold text-ink">
                  {index + 1}
                </span>
                <span className="min-w-0 truncate text-sm font-medium">
                  {hotspot.product.name}
                </span>
                <span className="text-sm">→</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

export default ShopTheLook;
