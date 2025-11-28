import React, { useState, useEffect, useCallback } from 'react';
import {
  getProducts,
  getCategories,
  getBrands,
  createProduct,
  addProductVariant,
  updateProduct,
  deleteProduct
} from '../api';
import { getPrimaryVariant, moneyToNumber, decimalToMinorUnits } from '../utils/product';

const EMPTY_VARIANT_FORM = {
  sku: '',
  name: '',
  price: '',
  stock: 0,
  currency: 'RUB'
};

function AdminProducts() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [variantForms, setVariantForms] = useState({});
  const [newItem, setNewItem] = useState({
    name: '',
    slug: '',
    category: '',
    brand: '',
    description: '',
    variantPrice: '',
    variantSku: '',
    variantStock: 0,
    variantCurrency: 'RUB'
  });

  const slugify = useCallback(
    (str) =>
      str
        .toString()
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-'),
    []
  );

  const normalizeProduct = useCallback((product) => {
    const variants = Array.isArray(product.variants)
      ? product.variants
      : product.variants
      ? Array.from(product.variants)
      : [];
    return {
      ...product,
      variants,
      categoryRef:
        typeof product.category === 'string'
          ? product.category
          : product.category?.slug || product.category?.id || '',
      brandRef:
        typeof product.brand === 'string'
          ? product.brand
          : product.brand?.slug || product.brand?.id || ''
    };
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const data = await getProducts();
      setItems(Array.isArray(data) ? data.map(normalizeProduct) : []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, [normalizeProduct]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    getCategories()
      .then((data) => {
        const cats = Array.isArray(data) ? data : [];
        setCategories(cats);
        if (cats.length > 0) {
          setNewItem((prev) => ({
            ...prev,
            category: prev.category || cats[0].slug || cats[0].id
          }));
        }
      })
      .catch((err) => console.error('Failed to fetch categories:', err));
    getBrands()
      .then((data) => {
        const brs = Array.isArray(data) ? data : [];
        setBrands(brs);
        if (brs.length > 0) {
          setNewItem((prev) => ({
            ...prev,
            brand: prev.brand || brs[0].slug || brs[0].id
          }));
        }
      })
      .catch((err) => console.error('Failed to fetch brands:', err));
  }, []);

  const handleEditChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === 'category') {
          return { ...item, categoryRef: value };
        }
        if (field === 'brand') {
          return { ...item, brandRef: value };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleSave = async (index) => {
    try {
      const product = items[index];
      await updateProduct(product.id, {
        name: product.name,
        description: product.description,
        slug: product.slug,
        category: product.categoryRef || undefined,
        brand: product.brandRef || undefined
      });
      await loadProducts();
    } catch (err) {
      console.error('Failed to update product:', err);
    } finally {
      setEditingIndex(null);
    }
  };

  const handleDelete = async (index) => {
    try {
      const product = items[index];
      await deleteProduct(product.id);
      setItems((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleNewItemChange = (field, value) => {
    setNewItem((prev) => {
      if (field === 'name') {
        const autoSlug = !prev.slug || prev.slug === slugify(prev.name) ? slugify(value) : prev.slug;
        return { ...prev, name: value, slug: autoSlug };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleAddNew = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.variantPrice) return;
    const slug = newItem.slug || slugify(newItem.name);
    const sku = newItem.variantSku || `${slug}-default`;
    const amount = decimalToMinorUnits(newItem.variantPrice);
    if (amount === null) {
      alert('Введите корректную цену варианта');
      return;
    }
    try {
      const created = await createProduct({
        name: newItem.name,
        description: newItem.description,
        slug,
        category: newItem.category || undefined,
        brand: newItem.brand || undefined
      });
      await addProductVariant(created.id, {
        sku,
        name: newItem.name,
        amount,
        currency: newItem.variantCurrency || 'RUB',
        stock: Number(newItem.variantStock) || 0
      });
      await loadProducts();
      setNewItem({
        name: '',
        slug: '',
        category: categories[0]?.slug || '',
        brand: brands[0]?.slug || '',
        description: '',
        variantPrice: '',
        variantSku: '',
        variantStock: 0,
        variantCurrency: 'RUB'
      });
    } catch (err) {
      console.error('Failed to create product:', err);
    }
  };

  const toggleVariants = (productId) => {
    setExpandedProductId((prev) => (prev === productId ? null : productId));
  };

  const handleVariantFormChange = (productId, field, value) => {
    setVariantForms((prev) => ({
      ...prev,
      [productId]: { ...EMPTY_VARIANT_FORM, ...prev[productId], [field]: value }
    }));
  };

  const handleVariantSubmit = async (productId) => {
    const form = variantForms[productId] || EMPTY_VARIANT_FORM;
    if (!form.sku || !form.price) return;
    const amount = decimalToMinorUnits(form.price);
    if (amount === null) {
      alert('Введите корректную цену варианта');
      return;
    }
    try {
      await addProductVariant(productId, {
        sku: form.sku,
        name: form.name || form.sku,
        amount,
        currency: form.currency || 'RUB',
        stock: Number(form.stock) || 0
      });
      await loadProducts();
      setVariantForms((prev) => ({ ...prev, [productId]: { ...EMPTY_VARIANT_FORM } }));
    } catch (err) {
      console.error('Failed to add variant:', err);
    }
  };

  const getCategoryName = (value) => {
    const match = categories.find((c) => c.slug === value || c.id === value);
    return match ? match.name : value;
  };

  const getBrandName = (value) => {
    const match = brands.find((b) => b.slug === value || b.id === value);
    return match ? match.name : value;
  };

  const renderVariantManager = (product) => {
    const variantForm = variantForms[product.id] || EMPTY_VARIANT_FORM;
    return (
      <tr key={`${product.id}-variants`} className="bg-gray-50">
        <td colSpan={7} className="p-4">
          <h4 className="font-semibold mb-2">Варианты товара</h4>
          {product.variants.length === 0 ? (
            <p className="text-sm text-muted">Пока нет созданных вариантов.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 mb-4">
                <thead className="bg-white">
                  <tr>
                    <th className="p-2 border-b">SKU</th>
                    <th className="p-2 border-b">Название</th>
                    <th className="p-2 border-b">Цена</th>
                    <th className="p-2 border-b">Остаток</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((variant) => (
                    <tr key={variant.id} className="border-b">
                      <td className="p-2">{variant.sku}</td>
                      <td className="p-2">{variant.name}</td>
                      <td className="p-2">
                        {variant.price ? moneyToNumber(variant.price).toLocaleString('ru-RU') : '—'} ₽
                      </td>
                      <td className="p-2">{variant.stock ?? variant.stockQuantity ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVariantSubmit(product.id);
            }}
            className="grid grid-cols-1 md:grid-cols-5 gap-2"
          >
            <input
              type="text"
              placeholder="SKU"
              value={variantForm.sku}
              onChange={(e) => handleVariantFormChange(product.id, 'sku', e.target.value)}
              className="p-2 border border-gray-300 rounded"
              required
            />
            <input
              type="text"
              placeholder="Название варианта"
              value={variantForm.name}
              onChange={(e) => handleVariantFormChange(product.id, 'name', e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Цена"
              value={variantForm.price}
              onChange={(e) => handleVariantFormChange(product.id, 'price', e.target.value)}
              className="p-2 border border-gray-300 rounded"
              required
            />
            <input
              type="number"
              placeholder="Остаток"
              value={variantForm.stock}
              onChange={(e) => handleVariantFormChange(product.id, 'stock', e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
            <button type="submit" className="button">
              Добавить вариант
            </button>
          </form>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Управление товарами</h1>
      <table className="w-full text-left border border-gray-200 text-sm">
        <thead className="bg-secondary">
          <tr>
            <th className="p-2 border-b">Название</th>
            <th className="p-2 border-b">Slug</th>
            <th className="p-2 border-b">Категория</th>
            <th className="p-2 border-b">Бренд</th>
            <th className="p-2 border-b">Варианты</th>
            <th className="p-2 border-b">Описание</th>
            <th className="p-2 border-b">Действия</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const primaryVariant = getPrimaryVariant(item);
            const variantSummary = primaryVariant
              ? `${moneyToNumber(primaryVariant.price).toLocaleString('ru-RU')} ₽${
                  item.variants.length > 1 ? ` · ${item.variants.length} шт.` : ''
                }`
              : 'Нет вариантов';
            return (
              <React.Fragment key={item.id || index}>
                <tr className="border-b align-top">
                  {editingIndex === index ? (
                    <>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.name || ''}
                          onChange={(e) => handleEditChange(index, 'name', e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.slug || ''}
                          onChange={(e) => handleEditChange(index, 'slug', e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.categoryRef || ''}
                          onChange={(e) => handleEditChange(index, 'category', e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                        >
                          {categories.map((cat) => (
                            <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={item.brandRef || ''}
                          onChange={(e) => handleEditChange(index, 'brand', e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                        >
                          {brands.map((b) => (
                            <option key={b.slug || b.id} value={b.slug || b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-sm text-muted">Управление ниже</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => handleEditChange(index, 'description', e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <button onClick={() => handleSave(index)} className="text-primary mr-2">
                          Сохранить
                        </button>
                        <button onClick={() => setEditingIndex(null)} className="text-gray-500">
                          Отмена
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">{item.name}</td>
                      <td className="p-2 text-xs text-muted">{item.slug}</td>
                      <td className="p-2">{getCategoryName(item.categoryRef)}</td>
                      <td className="p-2">{getBrandName(item.brandRef)}</td>
                      <td className="p-2">{variantSummary}</td>
                      <td className="p-2">{item.description ? `${item.description.substring(0, 60)}…` : ''}</td>
                      <td className="p-2 space-y-1">
                        <button onClick={() => setEditingIndex(index)} className="text-primary block">
                          Редактировать
                        </button>
                        <button onClick={() => handleDelete(index)} className="text-red-600 block">
                          Удалить
                        </button>
                        <button
                          onClick={() => toggleVariants(item.id)}
                          className="text-gray-600 underline text-xs block"
                        >
                          {expandedProductId === item.id ? 'Скрыть варианты' : 'Варианты'}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
                {expandedProductId === item.id && renderVariantManager(item)}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <h2 className="text-xl font-semibold">Добавить новый товар</h2>
      <form onSubmit={handleAddNew} className="space-y-2 max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <input
            type="text"
            placeholder="Название"
            value={newItem.name}
            onChange={(e) => handleNewItemChange('name', e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded mb-2 sm:mb-0"
            required
          />
          <input
            type="text"
            placeholder="Slug"
            value={newItem.slug}
            onChange={(e) => handleNewItemChange('slug', e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <select
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            className="p-2 border border-gray-300 rounded mb-2 sm:mb-0"
          >
            {categories.map((cat) => (
              <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={newItem.brand}
            onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
            className="p-2 border border-gray-300 rounded mb-2 sm:mb-0"
          >
            {brands.map((b) => (
              <option key={b.slug || b.id} value={b.slug || b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Описание (необязательно)"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <input
            type="text"
            placeholder="SKU варианта"
            value={newItem.variantSku}
            onChange={(e) => setNewItem({ ...newItem, variantSku: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded mb-2 sm:mb-0"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Цена варианта"
            value={newItem.variantPrice}
            onChange={(e) => setNewItem({ ...newItem, variantPrice: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded mb-2 sm:mb-0"
            required
          />
          <input
            type="number"
            placeholder="Количество"
            value={newItem.variantStock}
            onChange={(e) => setNewItem({ ...newItem, variantStock: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
        </div>
        <button type="submit" className="button">
          Добавить товар
        </button>
      </form>
    </div>
  );
}

export default AdminProducts;
