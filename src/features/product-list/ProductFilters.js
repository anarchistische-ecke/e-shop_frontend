import React from 'react';
import { Button, FilterToggle, Input, Modal, Select } from '../../components/ui';
import { PRODUCT_LIST_RATING_OPTIONS } from './constants';

function ProductFilterFields({
  brands,
  priceBounds,
  params,
  onBrandChange,
  onMinPriceChange,
  onMaxPriceChange,
  onRatingChange,
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

      <label className="block text-sm">
        <span className="text-xs uppercase tracking-[0.18em] text-muted">Рейтинг</span>
        <Select
          value={params.rating}
          onChange={(event) => onRatingChange(event.target.value)}
          className="mt-1 w-full"
        >
          {PRODUCT_LIST_RATING_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>

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
  onRatingChange,
  onToggleInStock,
  onToggleSale,
  onClearAll,
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
        onRatingChange={onRatingChange}
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
        onRatingChange={onRatingChange}
        onToggleInStock={onToggleInStock}
        onToggleSale={onToggleSale}
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
  onRatingChange,
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
        onRatingChange={onRatingChange}
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
  onRatingChange,
  onToggleInStock,
  onToggleSale,
  onClearAll,
  isFilterOpen,
  onCloseFilters,
  title = 'Уточните выбор',
  description = 'Фильтры'
}) {
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
    >
      <div className="space-y-3">
        <ProductFilterFields
          brands={brands}
          priceBounds={priceBounds}
          params={params}
          onBrandChange={onBrandChange}
          onMinPriceChange={onMinPriceChange}
          onMaxPriceChange={onMaxPriceChange}
          onRatingChange={onRatingChange}
          onToggleInStock={onToggleInStock}
          onToggleSale={onToggleSale}
        />
      </div>

      <div className={`mt-4 grid gap-2 ${activeFilterCount > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {activeFilterCount > 0 ? (
          <Button type="button" variant="secondary" block onClick={onClearAll}>
            Сбросить всё
          </Button>
        ) : null}
        <Button type="button" block onClick={onCloseFilters}>
          Показать товары
        </Button>
      </div>
    </Modal>
  );
}
