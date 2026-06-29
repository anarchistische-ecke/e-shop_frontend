import React, { useEffect, useState } from 'react';
import { Button, FilterToggle, Input, Modal, Select } from '../../components/ui';

function ProductFilterFields({
  brands,
  priceBounds,
  params,
  onBrandChange,
  onMinPriceChange,
  onMaxPriceChange,
  onToggleInStock,
  onToggleSale
}) {
  return (
    <>
      <label className="block text-sm">
        <span className="text-xs uppercase tracking-[0.18em] text-muted">Бренд</span>
        <Select
          value={params.brand}
          onChange={(event) => onBrandChange(event.target.value)}
          className="mt-1 w-full"
        >
          <option value="">Все бренды</option>
          {brands.map((brand) => (
            <option key={brand.slug || brand.id} value={brand.slug || brand.id}>
              {brand.name}
            </option>
          ))}
        </Select>
      </label>

      <div className="text-sm">
        <span className="text-xs uppercase tracking-[0.18em] text-muted">Цена, ₽</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            value={params.minPrice}
            onChange={(event) => onMinPriceChange(event.target.value)}
            placeholder={priceBounds.min ? `От ${priceBounds.min.toLocaleString('ru-RU')}` : 'От 0'}
          />
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            value={params.maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            placeholder={priceBounds.max ? `До ${priceBounds.max.toLocaleString('ru-RU')}` : 'До 0'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <FilterToggle
          type="button"
          onClick={onToggleInStock}
          active={params.inStock}
          aria-pressed={params.inStock}
        >
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
              params.inStock ? 'border-primary/45 bg-primary/20' : 'border-ink/20 bg-white'
            }`}
            aria-hidden="true"
          >
            {params.inStock ? '✓' : ''}
          </span>
          <span>Только в наличии</span>
        </FilterToggle>

        <FilterToggle
          type="button"
          onClick={onToggleSale}
          active={params.sale}
          aria-pressed={params.sale}
        >
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
              params.sale ? 'border-primary/45 bg-primary/20' : 'border-ink/20 bg-white'
            }`}
            aria-hidden="true"
          >
            {params.sale ? '✓' : ''}
          </span>
          <span>Со скидкой</span>
        </FilterToggle>
      </div>
    </>
  );
}

export function ProductFiltersPanel({
  brands,
  priceBounds,
  params,
  activeFilterCount,
  onBrandChange,
  onMinPriceChange,
  onMaxPriceChange,
  onToggleInStock,
  onToggleSale,
  onClearAll,
  onApplyFilters,
  isFilterOpen,
  onOpenFilters,
  onCloseFilters,
  title = 'Уточните выбор',
  description = 'Фильтры'
}) {
  return (
    <>
      <ProductFiltersTrigger
        activeFilterCount={activeFilterCount}
        isOpen={isFilterOpen}
        onOpenFilters={onOpenFilters}
      />
      <ProductFiltersDesktop
        brands={brands}
        priceBounds={priceBounds}
        params={params}
        onBrandChange={onBrandChange}
        onMinPriceChange={onMinPriceChange}
        onMaxPriceChange={onMaxPriceChange}
        onToggleInStock={onToggleInStock}
        onToggleSale={onToggleSale}
      />
      <ProductFiltersSheet
        brands={brands}
        priceBounds={priceBounds}
        params={params}
        activeFilterCount={activeFilterCount}
        onBrandChange={onBrandChange}
        onMinPriceChange={onMinPriceChange}
        onMaxPriceChange={onMaxPriceChange}
        onToggleInStock={onToggleInStock}
        onToggleSale={onToggleSale}
        onApplyFilters={onApplyFilters}
        onClearAll={onClearAll}
        isFilterOpen={isFilterOpen}
        onCloseFilters={onCloseFilters}
        title={title}
        description={description}
      />
    </>
  );
}

export function ProductFiltersTrigger({ activeFilterCount, isOpen = false, onOpenFilters }) {
  return (
    <Button
      type="button"
      variant="secondary"
      block
      size="sm"
      className="lg:hidden"
      onClick={onOpenFilters}
      aria-expanded={isOpen}
      aria-controls="product-filters-sheet"
      aria-haspopup="dialog"
    >
      Все фильтры{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
    </Button>
  );
}

export function ProductFiltersDesktop({
  brands,
  priceBounds,
  params,
  onBrandChange,
  onMinPriceChange,
  onMaxPriceChange,
  onToggleInStock,
  onToggleSale,
  className = 'mt-4 hidden gap-3 lg:grid xl:grid-cols-4'
}) {
  return (
    <div className={className}>
      <ProductFilterFields
        brands={brands}
        priceBounds={priceBounds}
        params={params}
        onBrandChange={onBrandChange}
        onMinPriceChange={onMinPriceChange}
        onMaxPriceChange={onMaxPriceChange}
        onToggleInStock={onToggleInStock}
        onToggleSale={onToggleSale}
      />
    </div>
  );
}

export function ProductFiltersSheet({
  brands,
  priceBounds,
  params,
  activeFilterCount,
  onBrandChange,
  onMinPriceChange,
  onMaxPriceChange,
  onToggleInStock,
  onToggleSale,
  onApplyFilters,
  onClearAll,
  isFilterOpen,
  onCloseFilters,
  title = 'Уточните выбор',
  description = 'Фильтры'
}) {
  const [draftParams, setDraftParams] = useState(params);
  const [isFieldFocused, setIsFieldFocused] = useState(false);

  useEffect(() => {
    if (isFilterOpen) {
      setDraftParams(params);
    }
  }, [isFilterOpen, params]);

  const updateDraft = (patch) => {
    setDraftParams((current) => ({
      ...current,
      ...patch
    }));
  };

  const applyDraft = () => {
    if (onApplyFilters) {
      onApplyFilters(draftParams);
      onCloseFilters();
      return;
    }
    if (draftParams.brand !== params.brand) onBrandChange(draftParams.brand);
    if (draftParams.minPrice !== params.minPrice) onMinPriceChange(draftParams.minPrice);
    if (draftParams.maxPrice !== params.maxPrice) onMaxPriceChange(draftParams.maxPrice);
    if (Boolean(draftParams.inStock) !== Boolean(params.inStock)) onToggleInStock();
    if (Boolean(draftParams.sale) !== Boolean(params.sale)) onToggleSale();
    onCloseFilters();
  };

  const clearDraft = () => {
    setDraftParams({
      ...params,
      brand: '',
      minPrice: '',
      maxPrice: '',
      inStock: false,
      sale: false
    });
  };

  return (
    <Modal
      panelId="product-filters-sheet"
      open={isFilterOpen}
      onClose={onCloseFilters}
      placement="sheet"
      size="sm"
      title={title}
      description={description}
      className="lg:hidden"
      panelClassName="h-[75dvh] max-h-[75dvh]"
    >
      <div
        className="space-y-3"
        onFocusCapture={(event) => {
          if (event.target?.matches?.('input, select, textarea')) {
            setIsFieldFocused(true);
          }
        }}
        onBlurCapture={(event) => {
          if (event.target?.matches?.('input, select, textarea')) {
            window.setTimeout(() => setIsFieldFocused(false), 0);
          }
        }}
      >
        <ProductFilterFields
          brands={brands}
          priceBounds={priceBounds}
          params={draftParams}
          onBrandChange={(brand) => updateDraft({ brand })}
          onMinPriceChange={(minPrice) => updateDraft({ minPrice })}
          onMaxPriceChange={(maxPrice) => updateDraft({ maxPrice })}
          onToggleInStock={() => updateDraft({ inStock: !draftParams.inStock })}
          onToggleSale={() => updateDraft({ sale: !draftParams.sale })}
        />
      </div>

      <div
        data-testid="product-filters-sheet-actions"
        className={`sticky bottom-0 mt-4 grid gap-2 border-t border-ink/10 bg-white/95 pt-3 transition-opacity ${
          activeFilterCount > 0 ? 'grid-cols-2' : 'grid-cols-1'
        } ${isFieldFocused ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      >
        {activeFilterCount > 0 ? (
          <Button type="button" variant="secondary" block onClick={clearDraft}>
            Сбросить всё
          </Button>
        ) : null}
        <Button type="button" block onClick={applyDraft}>
          Показать товары
        </Button>
      </div>
    </Modal>
  );
}
