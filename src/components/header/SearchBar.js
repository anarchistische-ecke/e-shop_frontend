import React from 'react';
import { Link } from 'react-router-dom';
import { Button, FilterChip, Input } from '../ui';
import { getPrimaryImageUrl, getProductPrice } from '../../utils/product';
import { normalizeSearchText } from '../../utils/search';
import { resolveCategoryToken } from '../../utils/header';
import { SearchIcon } from './icons';

function SearchPanelBody({
  autocompleteData,
  buildSearchParams,
  onNavigateSearch,
  onSetSearchScope,
  onSuggestionLinkClick,
  scopeOptions,
  searchScope,
  searchTerm
}) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Область поиска
        </span>
        <FilterChip
          type="button"
          onClick={() => onSetSearchScope('')}
          active={!searchScope}
        >
          Везде
        </FilterChip>
        {scopeOptions.map((category) => {
          const token = normalizeSearchText(resolveCategoryToken(category));
          const isActive = searchScope === token;
          return (
            <FilterChip
              key={resolveCategoryToken(category)}
              type="button"
              onClick={() => onSetSearchScope(isActive ? '' : token)}
              active={isActive}
            >
              {category.name}
            </FilterChip>
          );
        })}
      </div>

      {autocompleteData.hasCorrection && autocompleteData.correctedQuery ? (
        <p className="mb-3 text-xs text-muted">
          Показываем подсказки для{' '}
          <span className="font-semibold text-ink">
            “{autocompleteData.correctedQuery}”
          </span>
          . Исходный запрос:{' '}
          <span className="font-semibold text-ink">“{searchTerm.trim()}”</span>.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section>
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted">
            Подсказки поиска
          </p>
          <div className="space-y-1">
            {autocompleteData.suggestedQueries.length > 0 ? (
              autocompleteData.suggestedQueries.map((suggestion) => (
                <button
                  key={`${suggestion.label}-${suggestion.scopeToken}`}
                  type="button"
                  onClick={() => {
                    const nextScope = suggestion.scopeToken || searchScope;
                    onSetSearchScope(nextScope);
                    onNavigateSearch(suggestion.label, { scopeValue: nextScope });
                  }}
                  className="w-full rounded-xl border border-transparent px-3 py-2 text-left text-sm text-ink hover:border-ink/10 hover:bg-secondary/45"
                >
                  {suggestion.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted">
                Начните вводить запрос, чтобы увидеть подсказки.
              </p>
            )}
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted">
            Товары
          </p>
          <div className="space-y-1">
            {autocompleteData.productSuggestions.length > 0 ? (
              autocompleteData.productSuggestions.map((product) => {
                const previewImage = getPrimaryImageUrl(product);
                const previewPrice = getProductPrice(product);

                return (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    state={{
                      fromPath: `/category/search?${buildSearchParams(
                        searchTerm.trim() || autocompleteData.correctedQuery || '',
                        searchScope
                      ).toString()}`,
                      fromLabel: 'Результаты поиска'
                    }}
                    onClick={onSuggestionLinkClick}
                    className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-transparent px-3 py-2 hover:border-ink/10 hover:bg-secondary/45"
                  >
                    <div className="h-11 w-11 overflow-hidden rounded-xl border border-ink/10 bg-sand/60">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                          Фото
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted">
                        {(Number(product.rating) || 0) > 0
                          ? `★ ${Number(product.rating).toFixed(1)} · ${
                              product.reviewCount || product.reviewsCount || 0
                            } отзывов`
                          : 'Пока без отзывов'}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold text-accent">
                      {previewPrice.toLocaleString('ru-RU')} ₽
                    </p>
                  </Link>
                );
              })
            ) : (
              <p className="px-3 py-2 text-sm text-muted">
                Товары появятся, когда запрос станет точнее.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function SearchBar({
  autocompleteData,
  buildSearchParams,
  isSearchPanelVisible,
  onChange,
  onClear,
  onClose,
  onFocus,
  onNavigateSearch,
  onSetSearchScope,
  onSubmit,
  searchRef,
  searchScope,
  searchTerm,
  scopeOptions
}) {
  return (
    <div
      ref={searchRef}
      className={`relative col-span-2 lg:col-span-1 lg:col-start-2 ${
        isSearchPanelVisible ? 'z-[100]' : 'z-20'
      }`}
    >
      <form onSubmit={onSubmit} className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
        <Input
          type="text"
          value={searchTerm}
          onChange={onChange}
          onFocus={onFocus}
          placeholder="Поиск по товарам, коллекциям и категориям"
          className="bg-white pl-11 pr-12 shadow-[0_10px_24px_rgba(43,39,34,0.08)]"
          aria-label="Поиск товаров"
          autoComplete="off"
        />
        {searchTerm ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="absolute right-1 top-1/2 -translate-y-1/2"
            aria-label="Очистить поиск"
          >
            ×
          </Button>
        ) : null}
      </form>

      {isSearchPanelVisible ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/20 lg:hidden"
            onClick={onClose}
            aria-label="Закрыть подсказки поиска"
          />

          <div
            className="fixed left-3 right-3 z-[110] max-h-[70vh] overflow-y-auto rounded-[24px] border border-ink/10 bg-white p-4 shadow-[0_24px_56px_rgba(43,39,34,0.22)] lg:hidden"
            style={{ top: 'calc(var(--site-header-height, 6.5rem) + 0.5rem)' }}
          >
            <SearchPanelBody
              autocompleteData={autocompleteData}
              buildSearchParams={buildSearchParams}
              onNavigateSearch={onNavigateSearch}
              onSetSearchScope={onSetSearchScope}
              onSuggestionLinkClick={onClose}
              scopeOptions={scopeOptions}
              searchScope={searchScope}
              searchTerm={searchTerm}
            />
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-[110] rounded-[24px] border border-ink/10 bg-white p-4 shadow-[0_24px_56px_rgba(43,39,34,0.18)]">
              <SearchPanelBody
                autocompleteData={autocompleteData}
                buildSearchParams={buildSearchParams}
                onNavigateSearch={onNavigateSearch}
                onSetSearchScope={onSetSearchScope}
                onSuggestionLinkClick={onClose}
                scopeOptions={scopeOptions}
                searchScope={searchScope}
                searchTerm={searchTerm}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default SearchBar;
