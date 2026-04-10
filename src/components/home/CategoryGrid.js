import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui';
import CategoryCard from './CategoryCard';
import {
  buildCategoryCollections,
  resolveCategoryToken,
  resolveProductCategoryToken
} from '../../features/product-list/selectors';
import { getPrimaryImageUrl, resolveImageUrl } from '../../utils/product';
import { normalizeSearchText } from '../../utils/search';

function buildCategoryCards(categories = [], products = []) {
  const { navCategories, childrenByParent } = buildCategoryCollections(categories);

  return navCategories.slice(0, 6).map((category) => {
    const token = resolveCategoryToken(category);
    const normalizedToken = normalizeSearchText(token);
    const directChildren = childrenByParent[String(category.id)] || [];
    const matchingProducts = products.filter((product) => {
      const productToken = normalizeSearchText(resolveProductCategoryToken(product));
      return (
        productToken &&
        (productToken === normalizedToken ||
          directChildren.some(
            (child) => normalizeSearchText(resolveCategoryToken(child)) === productToken
          ))
      );
    });

    return {
      category,
      token,
      href: `/category/${token}`,
      imageUrl: resolveImageUrl(
        category.imageUrl ||
          category.image ||
          getPrimaryImageUrl(matchingProducts[0]) ||
          ''
      ),
      helperText:
        matchingProducts.length > 0
          ? `${matchingProducts.length} товаров`
          : directChildren.length > 0
          ? `${directChildren.length} подкатегорий`
          : 'Подборка для дома',
      description:
        category.description ||
        directChildren.slice(0, 3).map((child) => child.name).join(', ') ||
        'Подборка текстиля для дома и спальни.'
    };
  });
}

function CategoryGrid({ categories = [], products = [] }) {
  const cards = useMemo(() => buildCategoryCards(categories, products), [categories, products]);

  return (
    <section className="page-shell page-section">
      <div className="section-header">
        <div className="section-header__copy">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Каталог</p>
          <h2 className="text-2xl font-semibold md:text-3xl">
            Разделы каталога без скрытых свайпов
          </h2>
          <p className="mt-2 text-sm text-muted">
            Основные категории вынесены на главный экран, чтобы с первого касания
            перейти к нужной подборке.
          </p>
        </div>
        <Button as={Link} to="/catalog" variant="secondary" className="self-start">
          Весь каталог
        </Button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {cards.slice(0, 3).map((card) => (
          <Button
            key={`quick-${card.token}`}
            as={Link}
            to={card.href}
            variant="secondary"
            size="sm"
            className="whitespace-nowrap"
          >
            {card.name || card.category?.name}
          </Button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <CategoryCard key={card.token} {...card} />
        ))}
      </div>
    </section>
  );
}

export default CategoryGrid;
