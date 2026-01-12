import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../api';
import { resolveImageUrl } from '../utils/product';

const categoryAccents = [
  { gradient: 'from-[#f7f1ea] via-white to-[#f1e6dd]', orb: 'bg-[#e6d7ca]' },
  { gradient: 'from-[#f9f5f0] via-white to-[#efe3d9]', orb: 'bg-[#e3d2c2]' },
  { gradient: 'from-[#f5efe8] via-white to-[#e9ded4]', orb: 'bg-[#d9c9bb]' },
  { gradient: 'from-[#f4f0ea] via-white to-[#e6d9cd]', orb: 'bg-[#d6c5b5]' },
  { gradient: 'from-[#f6f1eb] via-white to-[#eadfd5]', orb: 'bg-[#dbcabb]' },
  { gradient: 'from-[#f8f2ee] via-white to-[#efe2d9]', orb: 'bg-[#e1d0c1]' },
];

function CataloguePage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getCategories()
      .then((data) => {
        if (!isMounted) return;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Failed to fetch categories:', err))
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const topCategories = useMemo(
    () => categories.filter((cat) => !cat.parentId),
    [categories]
  );

  const visibleCategories = topCategories.length ? topCategories : categories;

  return (
    <div className="catalogue-page">
      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="ambient-panel relative overflow-hidden rounded-3xl border border-white/70 bg-white/70 px-6 py-8 md:px-10 md:py-12 shadow-xl">
          <div className="absolute -top-20 right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl float-slow pointer-events-none" />
          <div className="absolute -bottom-16 left-6 h-32 w-32 rounded-full bg-sky/60 blur-3xl float-slow pointer-events-none" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-muted">Каталог</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mt-2">
                Выберите раздел и найдите тот самый уют
              </h1>
              <p className="text-sm text-muted mt-3 max-w-xl">
                Все категории собраны в одном месте: от спальни до ванной. Листайте, вдохновляйтесь и переходите в нужный раздел одним кликом.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/category/popular" className="button">Бестселлеры</Link>
                <Link to="/category/new" className="button-gray">Новинки</Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: 'Натуральные ткани',
                  text: 'Сатин, лен, поплин — мягко и долговечно.',
                },
                {
                  title: 'Готовые подборки',
                  text: 'Комбинации, где всё уже сочетается.',
                },
                {
                  title: 'Доставка по России',
                  text: 'Бесплатно от 5000 ₽, удобно и быстро.',
                },
                {
                  title: 'Собственное производство',
                  text: 'Контроль качества на каждом этапе.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm reveal-up"
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted mt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Разделы</p>
            <h2 className="text-2xl md:text-3xl font-semibold">Категории для каждого настроения</h2>
          </div>
          <Link to="/" className="button-ghost">На главную</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCategories.map((cat, idx) => {
            const accent = categoryAccents[idx % categoryAccents.length];
            const categoryImage = resolveImageUrl(
              cat.imageUrl || cat.image || cat.image_url || cat.thumbnail || ''
            );
            return (
              <Link
                key={cat.slug || cat.id}
                to={`/category/${cat.slug || cat.id}`}
                className={`group relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br ${accent.gradient} p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 reveal-up`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className={`absolute -top-14 -right-10 h-28 w-28 rounded-full ${accent.orb} blur-3xl opacity-70 transition group-hover:opacity-90`} />
                <div className="relative z-10 flex h-full flex-col gap-4">
                  <div className="rounded-2xl overflow-hidden border border-white/70 bg-white/80">
                    <div className="relative pt-[62%]">
                      {categoryImage ? (
                        <img
                          src={categoryImage}
                          alt={cat.name}
                          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                          Фото появится позже
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-semibold mb-1">{cat.name}</p>
                    <p className="text-sm text-muted mb-0">
                      {cat.description || 'Подборка уютного текстиля и аксессуаров для дома.'}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between text-sm font-semibold text-primary">
                    <span>Открыть категорию</span>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 shadow-sm transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
          {!loading && visibleCategories.length === 0 && (
            <div className="rounded-3xl border border-dashed border-ink/20 bg-white/80 p-8 text-center text-sm text-muted">
              Категории появятся после добавления в админке.
            </div>
          )}
          {loading && visibleCategories.length === 0 && (
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`category-skeleton-${idx}`}
                className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-sm animate-pulse"
              >
                <div className="rounded-2xl bg-ink/5 h-40" />
                <div className="mt-4 h-4 w-2/3 rounded-full bg-ink/10" />
                <div className="mt-2 h-3 w-full rounded-full bg-ink/10" />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default CataloguePage;
