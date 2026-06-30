import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import NotificationBanner from '../components/NotificationBanner';
import QuickViewSheet from '../components/commerce/QuickViewSheet';
import ProductCard from '../components/ProductCard';
import Seo from '../components/Seo';
import { Button, Card } from '../components/ui';
import { CartContext } from '../contexts/CartContext';
import { WishlistContext } from '../contexts/WishlistContext';
import { getPrimaryVariant } from '../utils/product';

function getVariants(product) {
  return Array.isArray(product?.variants) ? product.variants : Array.from(product?.variants || []);
}

function getStockValue(entity) {
  return Number(entity?.stock ?? entity?.stockQuantity ?? 0);
}

function FavoritesPage() {
  const { items, count, add, remove, clear } = useContext(WishlistContext);
  const { addItem } = useContext(CartContext);
  const [status, setStatus] = useState(null);
  const [pendingId, setPendingId] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [undoProduct, setUndoProduct] = useState(null);

  const handleAddSingleVariant = async (product) => {
    const variants = getVariants(product);
    const primaryVariant = getPrimaryVariant(product);
    if (!primaryVariant?.id || variants.length !== 1) {
      return;
    }

    setPendingId(product.id);
    setStatus(null);
    try {
      const result = await addItem(product, primaryVariant.id, 1);
      if (result?.ok === false) {
        setStatus(result.notification);
        return;
      }
      setStatus({
        type: 'success',
        title: 'Добавлено в корзину',
        message: `${product.name || 'Товар'} добавлен в корзину.`
      });
    } finally {
      setPendingId('');
    }
  };

  const handleRemove = (product) => {
    setUndoProduct(product);
    remove(product);
    setStatus({
      type: 'info',
      title: 'Товар убран из избранного',
      message: product?.name || 'Можно вернуть действие.'
    });
  };

  const handleUndoRemove = () => {
    if (!undoProduct) return;
    add(undoProduct);
    setUndoProduct(null);
    setStatus({
      type: 'success',
      message: 'Товар снова в избранном.'
    });
  };

  return (
    <div className="favorites-page page-section">
      <Seo
        title="Избранное"
        description="Сохранённые товары для быстрого возврата к покупке."
        canonicalPath="/favorites"
        robots="noindex,nofollow"
      />
      <div className="page-shell">
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted">
          <Link to="/" className="transition hover:text-primary">Главная</Link>
          <span className="text-ink/40">›</span>
          <span className="text-ink">Избранное</span>
        </nav>

        <div className="section-header mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Избранное</p>
            <h1 className="text-2xl font-semibold sm:text-3xl">Сохранённые товары</h1>
            <p className="mt-1 text-sm text-muted">
              {count > 0
                ? `${count} товаров доступны для быстрого возврата.`
                : 'Сохраняйте товары сердечком в каталоге и карточке товара.'}
            </p>
          </div>
          {count > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              Очистить избранное
            </Button>
          ) : null}
        </div>

        {status ? (
          <div className="mb-5">
            <NotificationBanner notification={status} />
            {undoProduct ? (
              <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={handleUndoRemove}>
                Вернуть
              </Button>
            ) : null}
          </div>
        ) : null}

        {items.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="mb-2 text-lg font-semibold">Избранное пока пусто</p>
            <p className="mx-auto mb-5 max-w-xl text-sm text-muted">
              Откройте каталог, отметьте подходящие комплекты и вернитесь к ним перед покупкой.
            </p>
            <Button as={Link} to="/catalog">
              Перейти в каталог
            </Button>
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="page-grid--catalog">
              {items.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  listName="favorites"
                  position={index + 1}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>

            <Card variant="quiet" padding="sm">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((product) => {
                  const variants = getVariants(product);
                  const canAddDirectly = variants.length === 1 && getPrimaryVariant(product)?.id;
                  const primaryVariant = getPrimaryVariant(product);
                  const inStock = getStockValue(primaryVariant) > 0;
                  return (
                    <div
                      key={`favorite-action-${product.id}`}
                      className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/90 px-3 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{product.name}</p>
                        <p className="text-xs text-muted">
                          {canAddDirectly
                            ? inStock
                              ? 'Можно добавить сразу'
                              : 'Нет в наличии'
                            : 'Нужно выбрать вариант'}
                        </p>
                      </div>
                      {canAddDirectly && inStock ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAddSingleVariant(product)}
                          disabled={pendingId === product.id}
                        >
                          {pendingId === product.id ? 'Добавляем…' : 'В корзину'}
                        </Button>
                      ) : (
                        <Button type="button" size="sm" variant="secondary" onClick={() => setQuickViewProduct(product)}>
                          {canAddDirectly ? 'Сообщить' : 'Выбрать'}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="!min-h-0 !px-1 text-xs text-muted"
                        onClick={() => handleRemove(product)}
                      >
                        Убрать
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
      <QuickViewSheet
        open={Boolean(quickViewProduct)}
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}

export default FavoritesPage;
