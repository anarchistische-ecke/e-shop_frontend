import React, { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Button, FilterChip, Input } from '../ui';
import CategoryGlyph from '../navigation/CategoryGlyph';
import { getPrimaryImageUrl, getProductPrice } from '../../utils/product';
import { normalizeSearchText } from '../../utils/search';
import { resolveCategoryToken } from '../../utils/header';
import { buildProductPath } from '../../utils/url';
import { buildSearchHref } from '../../features/product-list/url';
import { CloseIcon, SearchIcon } from './icons';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { trapFocusEvent } from '../../utils/a11y';

function SearchPanelBody({
  autocompleteData,
  onNavigateSearch,
  onSetSearchScope,
  onTrackSearchSuggestion,
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
            Быстрые запросы
          </p>
          <div className="space-y-1">
            {autocompleteData.suggestedQueries.length > 0 ? (
              autocompleteData.suggestedQueries.map((suggestion) => (
                <button
                  key={`${suggestion.label}-${suggestion.scopeToken}`}
                  type="button"
                  onClick={() => {
                    const nextScope = suggestion.scopeToken || searchScope;
                    onTrackSearchSuggestion('query', suggestion.label, nextScope);
                    onSetSearchScope(nextScope);
                    onNavigateSearch(suggestion.label, { scopeValue: nextScope });
                  }}
                  className="focus-ring-soft min-h-[44px] w-full rounded-xl border border-transparent px-3 py-2 text-left text-sm text-ink hover:border-ink/10 hover:bg-secondary/45"
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
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted">Категории</p>
          <div className="space-y-1">
            {autocompleteData.categorySuggestions.length > 0 ? (
              autocompleteData.categorySuggestions.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.token}`}
                  onClick={() => {
                    onTrackSearchSuggestion('category', category.token, category.token);
                    onSuggestionLinkClick();
                  }}
                  className="focus-ring-soft grid min-h-[44px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-transparent px-3 py-2 hover:border-ink/10 hover:bg-secondary/45"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-ink/10 bg-white/90 text-ink/80">
                    <CategoryGlyph category={category} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {category.label}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {category.description || 'Перейти в раздел каталога'}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-primary">→</span>
                </Link>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted">
                Категории появятся, когда запрос станет точнее.
              </p>
            )}
          </div>
        </section>

        <section className="md:col-span-2">
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
                    to={buildProductPath(product)}
                    state={{
                      fromPath: buildSearchHref({
                        query: searchTerm.trim() || autocompleteData.correctedQuery || '',
                        scope: searchScope
                      }),
                      fromLabel: 'Результаты поиска'
                    }}
                    onClick={() => {
                      onTrackSearchSuggestion('product', String(product.id || ''), searchScope);
                      onSuggestionLinkClick();
                    }}
                    className="focus-ring-soft grid min-h-[44px] grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-transparent px-3 py-2 hover:border-ink/10 hover:bg-secondary/45"
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
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold text-ink">
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

function MobileSearchDialog({ inputRef, hasSuggestions, onChange, onClear, onClose, onSubmit, panelProps }) {
  const dialogRef = useRef(null);
  const suggestionsId = 'header-search-suggestions-mobile';
  const { searchTerm, scopeOptions } = panelProps;
  useBodyScrollLock(true);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    const fitVisibleViewport = () => {
      dialog.style.top = `${viewport.offsetTop}px`;
      dialog.style.height = `${viewport.height}px`;
    };
    fitVisibleViewport();
    viewport.addEventListener('resize', fitVisibleViewport);
    viewport.addEventListener('scroll', fitVisibleViewport);
    return () => {
      viewport.removeEventListener('resize', fitVisibleViewport);
      viewport.removeEventListener('scroll', fitVisibleViewport);
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-canvas lg:hidden">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-search-title"
        data-testid="mobile-search-dialog"
        className="fixed inset-x-0 top-0 flex h-[100dvh] flex-col overflow-hidden bg-canvas"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onClose();
          } else {
            trapFocusEvent(event, dialogRef.current);
          }
        }}
      >
        <div className="shrink-0 border-b border-line bg-white px-4 pb-4 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 id="mobile-search-title" className="text-2xl font-semibold text-ink">Поиск по магазину</h2>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть поиск">
              <CloseIcon />
            </Button>
          </div>
          <form onSubmit={onSubmit} className="flex gap-2" role="search">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                ref={inputRef}
                type="search"
                inputMode="search"
                value={searchTerm}
                onChange={onChange}
                placeholder="Название товара или ткани"
                className="!pl-9 !pr-10 [&::-webkit-search-cancel-button]:appearance-none"
                aria-label="Поиск товаров"
                aria-controls={hasSuggestions ? suggestionsId : undefined}
                autoComplete="off"
                enterKeyHint="search"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={onClear}
                  className="focus-ring-soft absolute inset-y-0 right-0 grid w-11 place-items-center rounded-lg text-muted"
                  aria-label="Очистить поиск"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <Button type="submit" disabled={!searchTerm.trim()} className="shrink-0 !px-3">Найти</Button>
          </form>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          {hasSuggestions ? (
            <div id={suggestionsId} data-testid="header-search-suggestions-mobile">
              <SearchPanelBody {...panelProps} scopeOptions={scopeOptions.slice(0, 4)} />
            </div>
          ) : (
            <p className="text-sm text-muted">
              {searchTerm.trim() ? 'Введите минимум 2 символа для подсказок.' : 'Введите название товара или ткани.'}
            </p>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}

function SearchBar({
  autocompleteData,
  isSearchOpen = false,
  isSearchPanelVisible,
  onChange,
  onClear,
  onClose,
  onCloseMobile,
  onFocus,
  onNavigateSearch,
  onSetSearchScope,
  onSubmit,
  onTrackSearchSuggestion,
  searchRef,
  mobileSearchInputRef,
  searchScope,
  searchTerm,
  scopeOptions
}) {
  const desktopSearchSuggestionsId = 'header-search-suggestions';
  const panelProps = {
    autocompleteData,
    onNavigateSearch,
    onSetSearchScope,
    onTrackSearchSuggestion,
    onSuggestionLinkClick: onClose,
    scopeOptions,
    searchScope,
    searchTerm
  };

  return (
    <div ref={searchRef} className="contents">
      {isSearchOpen ? (
        <MobileSearchDialog
          inputRef={mobileSearchInputRef}
          hasSuggestions={isSearchPanelVisible}
          onChange={onChange}
          onClear={onClear}
          onClose={onCloseMobile}
          onSubmit={onSubmit}
          panelProps={panelProps}
        />
      ) : null}

      <div
        className={`relative hidden lg:col-span-1 lg:col-start-2 lg:block ${
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
            placeholder="Поиск товаров и категорий"
            className="bg-white pl-11 pr-12 shadow-none"
            aria-label="Поиск товаров"
            aria-expanded={isSearchPanelVisible}
            aria-controls={isSearchPanelVisible ? desktopSearchSuggestionsId : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            enterKeyHint="search"
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
              className="viewport-fixed-screen fixed inset-0 z-40 hidden bg-black/20 lg:block"
              onClick={onClose}
              aria-label="Закрыть подсказки поиска"
            />

            <div className="relative">
              <div
                id={desktopSearchSuggestionsId}
                data-testid="header-search-suggestions"
                className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-[110] rounded-lg border border-ink/10 bg-white p-4 shadow-[0_24px_56px_rgba(43,39,34,0.18)]"
              >
                <SearchPanelBody {...panelProps} />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default SearchBar;
