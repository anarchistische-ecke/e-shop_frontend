import React, { useState, useEffect, useCallback } from 'react';
import {
  getProducts,
  getCategories,
  getBrands,
  createProduct,
  addProductVariant,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  adjustStock
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
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [variantForms, setVariantForms] = useState({});
  const [uploadingImages, setUploadingImages] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [variantEditForms, setVariantEditForms] = useState({});
  const [modalVariantForm, setModalVariantForm] = useState(EMPTY_VARIANT_FORM);
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
  const [newItemImages, setNewItemImages] = useState([]);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkBrand, setBulkBrand] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });
  const [stockAdjustments, setStockAdjustments] = useState({});

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
    const images = Array.isArray(product.images)
      ? product.images
      : product.images
      ? Array.from(product.images)
      : [];
    return {
      ...product,
      variants,
      images,
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
      const normalized = Array.isArray(data) ? data.map(normalizeProduct) : [];
      setItems(normalized);
      setSelectedIds((prev) => prev.filter((id) => normalized.some((p) => p.id === id)));
      setPage(1);
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
        setNewItem((prev) => ({ ...prev, category: prev.category }));
      })
      .catch((err) => console.error('Failed to fetch categories:', err));
    getBrands()
      .then((data) => {
        const brs = Array.isArray(data) ? data : [];
        setBrands(brs);
        setNewItem((prev) => ({ ...prev, brand: prev.brand }));
      })
      .catch((err) => console.error('Failed to fetch brands:', err));
  }, []);

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(items.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (productId) => {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const openEditModal = (product) => {
    setEditingProduct({
      ...product,
      categoryRef: product.categoryRef || '',
      brandRef: product.brandRef || '',
      description: product.description || ''
    });
    const map = {};
    (product.variants || []).forEach((v) => {
      map[v.id] = {
        name: v.name,
        price: v.price ? moneyToNumber(v.price) : '',
        stock: v.stock ?? v.stockQuantity ?? 0,
        currency: v.price?.currency || 'RUB'
      };
    });
    setVariantEditForms(map);
    setModalVariantForm({ ...EMPTY_VARIANT_FORM, sku: `${product.slug || 'sku'}-${product.variants?.length || 0}` });
    setEditModalOpen(true);
  };

  const handleDelete = async (index) => {
    try {
      const product = items[index];
      setConfirmDialog({
        open: true,
        message: `Удалить товар "${product.name}"?`,
        onConfirm: async () => {
          await deleteProduct(product.id);
          setItems((prev) => prev.filter((p) => p.id !== product.id));
          setSelectedIds((prev) => prev.filter((id) => id !== product.id));
        }
      });
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
      if (newItemImages.length > 0) {
        await uploadProductImages(created.id, newItemImages);
      }
      await loadProducts();
      setNewItem({
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
      setNewItemImages([]);
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

  const handleStockDeltaChange = (variantId, value) => {
    setStockAdjustments((prev) => ({ ...prev, [variantId]: value }));
  };

  const applyStockAdjustment = async (productId, variantId) => {
    const rawDelta = stockAdjustments[variantId];
    const delta = Number(rawDelta);
    if (!delta || Number.isNaN(delta)) return;
    const idempotencyKey = `admin-${variantId}-${Date.now()}`;
    try {
      const result = await adjustStock(variantId, delta, {
        reason: 'ADMIN_PANEL',
        idempotencyKey
      });
      setStockAdjustments((prev) => ({ ...prev, [variantId]: '' }));
      // Optimistically refresh UI
      setItems((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                variants: (p.variants || []).map((v) =>
                  v.id === variantId ? { ...v, stock: result.stock, stockQuantity: result.stock } : v
                )
              }
            : p
        )
      );
      if (editingProduct && editingProduct.id === productId) {
        setEditingProduct((prev) =>
          prev
            ? {
                ...prev,
                variants: prev.variants.map((v) =>
                  v.id === variantId ? { ...v, stock: result.stock, stockQuantity: result.stock } : v
                )
              }
            : prev
        );
      }
    } catch (err) {
      console.error('Failed to adjust stock:', err);
      alert('Не удалось изменить запас. Попробуйте ещё раз.');
    }
  };

  const handleVariantEditChange = (variantId, field, value) => {
    setVariantEditForms((prev) => ({
      ...prev,
      [variantId]: { ...prev[variantId], [field]: value }
    }));
  };

  const handleSaveVariant = async (productId, variantId) => {
    const form = variantEditForms[variantId];
    if (!form || !form.price) return;
    const amount = decimalToMinorUnits(form.price);
    if (amount === null) {
      alert('Введите корректную цену варианта');
      return;
    }
    try {
      const payload = {
        name: form.name,
        amount,
        currency: form.currency || 'RUB',
        stock: Number(form.stock) || 0
      };
      await updateProductVariant(productId, variantId, payload);
      setEditingProduct((prev) =>
        prev
          ? {
              ...prev,
              variants: prev.variants.map((v) =>
                v.id === variantId
                  ? { ...v, name: payload.name, price: { amount, currency: payload.currency }, stock: payload.stock, stockQuantity: payload.stock }
                  : v
              )
            }
          : prev
      );
      await loadProducts();
    } catch (err) {
      console.error('Failed to update variant:', err);
    }
  };

  const handleModalVariantChange = (field, value) => {
    setModalVariantForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddVariantInModal = async () => {
    if (!editingProduct) return;
    if (!modalVariantForm.sku || !modalVariantForm.price) return;
    const amount = decimalToMinorUnits(modalVariantForm.price);
    if (amount === null) {
      alert('Введите корректную цену варианта');
      return;
    }
    try {
      await addProductVariant(editingProduct.id, {
        sku: modalVariantForm.sku,
        name: modalVariantForm.name || modalVariantForm.sku,
        amount,
        currency: modalVariantForm.currency || 'RUB',
        stock: Number(modalVariantForm.stock) || 0
      });
      setModalVariantForm(EMPTY_VARIANT_FORM);
      await loadProducts();
    } catch (err) {
      console.error('Failed to add variant:', err);
    }
  };

  const handleModalSave = async () => {
    if (!editingProduct) return;
    try {
      await updateProduct(editingProduct.id, {
        name: editingProduct.name,
        description: editingProduct.description,
        slug: editingProduct.slug,
        category: editingProduct.categoryRef || undefined,
        brand: editingProduct.brandRef || undefined
      });
      setEditModalOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (err) {
      console.error('Failed to update product:', err);
    }
  };

  const closeConfirm = () => setConfirmDialog({ open: false, message: '', onConfirm: null });

  const handleUploadImages = async (productId, files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;
    setUploadingImages((prev) => ({ ...prev, [productId]: true }));
    try {
      await uploadProductImages(productId, list);
      await loadProducts();
    } catch (err) {
      console.error('Failed to upload product images:', err);
    } finally {
      setUploadingImages((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleDeleteImage = async (productId, imageId) => {
    try {
      await deleteProductImage(productId, imageId);
      await loadProducts();
    } catch (err) {
      console.error('Failed to delete product image:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setConfirmDialog({
      open: true,
      message: `Удалить выбранные товары (${selectedIds.length})? Это действие необратимо.`,
      onConfirm: async () => {
        for (const id of selectedIds) {
          try {
            await deleteProduct(id);
          } catch (err) {
            console.error('Failed to delete product', id, err);
          }
        }
        setSelectedIds([]);
        await loadProducts();
      }
    });
  };

  const handleBulkCategoryChange = async () => {
    for (const id of selectedIds) {
      try {
        const product = items.find((p) => p.id === id);
        if (!product) continue;
        await updateProduct(id, {
          name: product.name,
          description: product.description,
          slug: product.slug,
          category: bulkCategory || undefined,
          brand: product.brandRef || undefined
        });
      } catch (err) {
        console.error('Failed to bulk change category for', id, err);
      }
    }
    await loadProducts();
  };

  const handleBulkBrandChange = async () => {
    for (const id of selectedIds) {
      try {
        const product = items.find((p) => p.id === id);
        if (!product) continue;
        await updateProduct(id, {
          name: product.name,
          description: product.description,
          slug: product.slug,
          category: product.categoryRef || undefined,
          brand: bulkBrand || undefined
        });
      } catch (err) {
        console.error('Failed to bulk change brand for', id, err);
      }
    }
    await loadProducts();
  };

  const handleBulkPriceChange = async () => {
    if (!bulkPrice) return;
    const amount = decimalToMinorUnits(bulkPrice);
    if (amount === null) {
      alert('Введите корректную цену');
      return;
    }
    for (const id of selectedIds) {
      try {
        const product = items.find((p) => p.id === id);
        const primary = getPrimaryVariant(product);
        if (!product || !primary) continue;
        await updateProductVariant(product.id, primary.id, {
          name: primary.name,
          amount,
          currency: primary.price?.currency || 'RUB',
          stock: primary.stock || primary.stockQuantity || 0
        });
      } catch (err) {
        console.error('Failed to bulk change price for', id, err);
      }
    }
    await loadProducts();
  };

  const getCategoryName = (value) => {
    if (!value) return '—';
    const match = categories.find((c) => c.slug === value || c.id === value);
    return match ? match.name : value;
  };

  const getBrandName = (value) => {
    if (!value) return '—';
    const match = brands.find((b) => b.slug === value || b.id === value);
    return match ? match.name : value;
  };

  const renderVariantManager = (product) => {
    const variantForm = variantForms[product.id] || EMPTY_VARIANT_FORM;
    return (
      <tr key={`${product.id}-variants`} className="bg-gray-50">
        <td colSpan={8} className="p-4">
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Изображения</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {product.images && product.images.length > 0 ? (
                product.images.map((img) => (
                  <div key={img.id} className="relative w-24 h-24 rounded overflow-hidden border border-gray-200 bg-white">
                    <img src={img.url} alt={product.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white/90 text-xs px-1 rounded shadow"
                      onClick={() => handleDeleteImage(product.id, img.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">Пока нет загруженных изображений.</p>
              )}
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded cursor-pointer hover:border-primary text-sm bg-white">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleUploadImages(product.id, e.target.files);
                  e.target.value = '';
                }}
              />
              {uploadingImages[product.id] ? 'Загружаем…' : 'Добавить изображения'}
            </label>
            <p className="text-xs text-muted mt-1">
              Можно оставить товар без фото и загрузить их позже.
            </p>
          </div>
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
                    <th className="p-2 border-b">Коррекция</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((variant) => (
                    <tr key={variant.id} className="border-b align-top">
                      <td className="p-2">{variant.sku}</td>
                      <td className="p-2">{variant.name}</td>
                      <td className="p-2">
                        {variant.price ? moneyToNumber(variant.price).toLocaleString('ru-RU') : '—'} ₽
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {variant.stock ?? variant.stockQuantity ?? '—'} шт.
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="+/-"
                            value={stockAdjustments[variant.id] ?? ''}
                            onChange={(e) => handleStockDeltaChange(variant.id, e.target.value)}
                            className="p-2 border border-gray-300 rounded w-24"
                          />
                          <button
                            type="button"
                            className="button text-xs"
                            onClick={() => applyStockAdjustment(product.id, variant.id)}
                            disabled={!stockAdjustments[variant.id]}
                          >
                            Применить
                          </button>
                        </div>
                        <p className="text-xs text-muted mt-1">Используйте + / - для пополнения или списания</p>
                      </td>
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
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-muted">Выбрано: {selectedIds.length}</div>
          <button className="button-gray text-sm" onClick={handleBulkDelete} disabled={selectedIds.length === 0}>
            Удалить выбранные
          </button>
          <div className="flex items-center gap-2">
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="p-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Категория...</option>
              <option value="">Без категории</option>
              {categories.map((cat) => (
                <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button className="button text-sm" onClick={handleBulkCategoryChange} disabled={selectedIds.length === 0}>
              Применить
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={bulkBrand}
              onChange={(e) => setBulkBrand(e.target.value)}
              className="p-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Бренд...</option>
              <option value="">Без бренда</option>
              {brands.map((b) => (
                <option key={b.slug || b.id} value={b.slug || b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button className="button text-sm" onClick={handleBulkBrandChange} disabled={selectedIds.length === 0}>
              Применить
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Новая цена"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              className="p-2 border border-gray-300 rounded text-sm"
            />
            <button className="button text-sm" onClick={handleBulkPriceChange} disabled={!bulkPrice || selectedIds.length === 0}>
              Изменить цену
            </button>
          </div>
        </div>
        <p className="text-xs text-muted">Массовые действия применяются к выделенным товарам. Цена меняется для основного варианта.</p>
      </div>
      <table className="w-full text-left border border-gray-200 text-sm">
        <thead className="bg-secondary">
          <tr>
            <th className="p-2 border-b w-10">
              <input
                type="checkbox"
                checked={items.length > 0 && selectedIds.length === items.length}
                onChange={(e) => toggleSelectAll(e.target.checked)}
              />
            </th>
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
          {items.slice((page - 1) * pageSize, page * pageSize).map((item, index) => {
            const primaryVariant = getPrimaryVariant(item);
            const variantSummary = primaryVariant
              ? `${moneyToNumber(primaryVariant.price).toLocaleString('ru-RU')} ₽${
                  item.variants.length > 1 ? ` · ${item.variants.length} шт.` : ''
                }`
              : 'Нет вариантов';
            return (
              <React.Fragment key={item.id || index}>
                <tr className="border-b align-top">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2 text-xs text-muted">{item.slug}</td>
                  <td className="p-2">{getCategoryName(item.categoryRef)}</td>
                  <td className="p-2">{getBrandName(item.brandRef)}</td>
                  <td className="p-2">{variantSummary}</td>
                  <td className="p-2">{item.description ? `${item.description.substring(0, 60)}…` : ''}</td>
                  <td className="p-2 space-y-1">
                    <button onClick={() => openEditModal(item)} className="text-primary block">
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
                </tr>
                {expandedProductId === item.id && renderVariantManager(item)}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span>На странице:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="p-1 border border-gray-300 rounded"
          >
            {[25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="button-gray text-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Назад
          </button>
          <span>Страница {page} / {Math.max(1, Math.ceil(items.length / pageSize))}</span>
          <button
            className="button text-sm"
            disabled={page >= Math.ceil(items.length / pageSize)}
            onClick={() => setPage((p) => p + 1)}
          >
            Вперёд
          </button>
        </div>
      </div>
      {confirmDialog.open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeConfirm}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2">
              <button className="button-gray" onClick={closeConfirm}>
                Отмена
              </button>
              <button
                className="button"
                onClick={async () => {
                  if (confirmDialog.onConfirm) {
                    await confirmDialog.onConfirm();
                  }
                  closeConfirm();
                }}
              >
                ОК
              </button>
            </div>
          </div>
        </div>
      )}
      {editModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Редактирование товара</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-muted text-sm">Закрыть</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                placeholder="Название"
                className="p-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                value={editingProduct.slug}
                onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                placeholder="Slug"
                className="p-2 border border-gray-300 rounded"
              />
              <select
                value={editingProduct.categoryRef || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, categoryRef: e.target.value })}
                className="p-2 border border-gray-300 rounded"
              >
                <option value="">Без категории</option>
                {categories.map((cat) => (
                  <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={editingProduct.brandRef || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, brandRef: e.target.value })}
                className="p-2 border border-gray-300 rounded"
              >
                <option value="">Без бренда</option>
                {brands.map((b) => (
                  <option key={b.slug || b.id} value={b.slug || b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <textarea
                value={editingProduct.description || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                placeholder="Описание"
                className="p-2 border border-gray-300 rounded md:col-span-2"
              />
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Изображения</h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {editingProduct.images && editingProduct.images.length > 0 ? (
                  editingProduct.images.map((img) => (
                    <div key={img.id} className="relative w-24 h-24 rounded overflow-hidden border border-gray-200 bg-white">
                      <img src={img.url} alt={editingProduct.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-white/90 text-xs px-1 rounded shadow"
                        onClick={() => handleDeleteImage(editingProduct.id, img.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">Нет изображений</p>
                )}
              </div>
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded cursor-pointer hover:border-primary text-sm bg-white">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleUploadImages(editingProduct.id, e.target.files);
                    e.target.value = '';
                  }}
                />
                {uploadingImages[editingProduct.id] ? 'Загружаем…' : 'Добавить изображения'}
              </label>
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Варианты</h4>
              <div className="space-y-3">
                {(editingProduct.variants || []).map((variant) => {
                  const form = variantEditForms[variant.id] || {};
                  return (
                    <div key={variant.id} className="border border-gray-200 rounded p-3 grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                      <div>
                        <label className="block text-xs text-muted">Название</label>
                        <input
                          type="text"
                          value={form.name || ''}
                          onChange={(e) => handleVariantEditChange(variant.id, 'name', e.target.value)}
                          className="p-2 border border-gray-300 rounded w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted">Цена</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.price || ''}
                          onChange={(e) => handleVariantEditChange(variant.id, 'price', e.target.value)}
                          className="p-2 border border-gray-300 rounded w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted">Количество</label>
                        <input
                          type="number"
                          value={form.stock ?? 0}
                          onChange={(e) => handleVariantEditChange(variant.id, 'stock', e.target.value)}
                          className="p-2 border border-gray-300 rounded w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted">Валюта</label>
                        <input
                          type="text"
                          value={form.currency || 'RUB'}
                          onChange={(e) => handleVariantEditChange(variant.id, 'currency', e.target.value)}
                          className="p-2 border border-gray-300 rounded w-full"
                        />
                      </div>
                      <button
                        type="button"
                        className="button text-sm"
                        onClick={() => handleSaveVariant(editingProduct.id, variant.id)}
                      >
                        Сохранить вариант
                      </button>
                    </div>
                  );
                })}
                {(!editingProduct.variants || editingProduct.variants.length === 0) && (
                  <p className="text-sm text-muted">Добавьте варианты ниже в таблице.</p>
                )}
                <div className="border border-dashed border-gray-300 rounded p-3 grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                  <input
                    type="text"
                    placeholder="SKU"
                    value={modalVariantForm.sku}
                    onChange={(e) => handleModalVariantChange('sku', e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Название"
                    value={modalVariantForm.name}
                    onChange={(e) => handleModalVariantChange('name', e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Цена"
                    value={modalVariantForm.price}
                    onChange={(e) => handleModalVariantChange('price', e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Остаток"
                    value={modalVariantForm.stock}
                    onChange={(e) => handleModalVariantChange('stock', e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Валюта"
                    value={modalVariantForm.currency}
                    onChange={(e) => handleModalVariantChange('currency', e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <button type="button" className="button text-sm" onClick={handleAddVariantInModal}>
                    Добавить вариант
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="button-gray" onClick={() => setEditModalOpen(false)}>Отмена</button>
              <button className="button" onClick={handleModalSave}>Сохранить товар</button>
            </div>
          </div>
        </div>
      )}
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
            <option value="">Без категории</option>
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
            <option value="">Без бренда</option>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <label className="flex-1 px-3 py-2 border border-dashed border-gray-300 rounded cursor-pointer bg-white text-sm">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                setNewItemImages(Array.from(e.target.files || []));
                e.target.value = '';
              }}
            />
            {newItemImages.length > 0
              ? `Выбрано файлов: ${newItemImages.length}`
              : 'Загрузить изображения (опционально)'}
          </label>
          {newItemImages.length > 0 && (
            <button
              type="button"
              onClick={() => setNewItemImages([])}
              className="text-xs text-muted underline"
            >
              Очистить выбор
            </button>
          )}
        </div>
        <button type="submit" className="button">
          Добавить товар
        </button>
      </form>
    </div>
  );
}

export default AdminProducts;
