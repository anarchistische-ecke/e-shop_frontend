import React from 'react';
import { getProducts } from '../api';
import { homeHeroDefaults } from '../data/homeHeroDefaults';
import { getPrimaryImageUrl } from '../utils/product';

function AdminMainPage() {
  const [products, setProducts] = React.useState([]);
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  const [config, setConfig] = React.useState(() => {
    if (typeof window === 'undefined') return { ...homeHeroDefaults };
    const stored = localStorage.getItem('homeHeroConfig');
    if (!stored) return { ...homeHeroDefaults };
    try {
      const parsed = JSON.parse(stored);
      return { ...homeHeroDefaults, ...parsed };
    } catch (err) {
      console.error('Failed to parse home hero config', err);
      return { ...homeHeroDefaults };
    }
  });

  React.useEffect(() => {
    getProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch products for hero config:', err))
      .finally(() => setLoadingProducts(false));
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('homeHeroConfig', JSON.stringify(config));
    }
  }, [config]);

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const resetToDefaults = () => setConfig({ ...homeHeroDefaults });

  const featuredProduct = products.find((p) => p.id === config.featuredProductId) || null;
  const previewImage = getPrimaryImageUrl(featuredProduct);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Главная страница</h1>
          <p className="text-sm text-muted">
            Настройте избранный товар и текст в герое главной страницы. Сохранение происходит автоматически.
          </p>
        </div>
        <button className="button-gray text-sm" onClick={resetToDefaults}>
          Сбросить на дефолт
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Плашка над заголовком</label>
              <input
                type="text"
                value={config.badge}
                onChange={(e) => handleChange('badge', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Подпись к товару</label>
              <input
                type="text"
                value={config.featuredLabel}
                onChange={(e) => handleChange('featuredLabel', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Заголовок (левая часть)</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Заголовок (акцентная часть)</label>
              <input
                type="text"
                value={config.accent}
                onChange={(e) => handleChange('accent', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Описание рядом с товаром</label>
            <textarea
              value={config.subtitle}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Основная кнопка</p>
              <input
                type="text"
                value={config.primaryCtaLabel}
                onChange={(e) => handleChange('primaryCtaLabel', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Текст кнопки"
              />
              <input
                type="text"
                value={config.primaryCtaLink}
                onChange={(e) => handleChange('primaryCtaLink', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="/category/popular"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Вторая кнопка</p>
              <input
                type="text"
                value={config.secondaryCtaLabel}
                onChange={(e) => handleChange('secondaryCtaLabel', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Текст кнопки"
              />
              <input
                type="text"
                value={config.secondaryCtaLink}
                onChange={(e) => handleChange('secondaryCtaLink', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="/category/new"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
          <div>
            <p className="text-sm font-semibold mb-2">Избранный товар</p>
            {loadingProducts ? (
              <p className="text-sm text-muted">Загружаем товары...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted">Добавьте товары, чтобы выбрать один из них.</p>
            ) : (
              <select
                value={config.featuredProductId}
                onChange={(e) => handleChange('featuredProductId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Автоматически первый из каталога</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm space-y-2">
            <p className="font-semibold">Превью</p>
            <p className="text-muted text-xs">
              Показываем выбранный товар и текст, как на главной странице.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 bg-white border border-gray-200 rounded overflow-hidden">
                {previewImage ? (
                  <img src={previewImage} alt={featuredProduct?.name || 'product'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[11px] text-muted text-center px-1">
                    Нет фото
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-muted">{config.featuredLabel}</p>
                <p className="font-semibold text-sm">{featuredProduct?.name || 'Товар из каталога'}</p>
                <p className="text-xs text-muted">{config.subtitle.slice(0, 80)}{config.subtitle.length > 80 ? '…' : ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMainPage;
