import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  getProducts,
  getProduct,
  getCategories,
  getBrands,
  createProduct,
  addProductVariant,
  updateProductVariant,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  updateProductImage,
  adjustStock
} from '../api';
import { getPrimaryVariant, moneyToNumber, decimalToMinorUnits, normalizeProductImages } from '../utils/product';

const EMPTY_VARIANT_FORM = {
  sku: '',
  name: '',
  price: '',
  stock: 0,
  currency: 'RUB',
  weightGrossG: '',
  lengthMm: '',
  widthMm: '',
  heightMm: ''
};

const parseOptionalInt = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : Math.round(parsed);
};

const NO_BULK_BRAND = '__NO_CHANGE__';

const normalizeSpecSections = (sections) => {
  if (!Array.isArray(sections)) return [];
  return sections.map((section) => ({
    title: section?.title || '',
    description: section?.description || '',
    items: Array.isArray(section?.items)
      ? section.items.map((item) => ({
          label: item?.label || '',
          value: item?.value || ''
        }))
      : []
  }));
};

const sanitizeSpecSections = (sections) =>
  normalizeSpecSections(sections)
    .map((section) => ({
      title: section.title.trim(),
      description: section.description.trim(),
      items: section.items
        .map((item) => ({
          label: item.label.trim(),
          value: item.value.trim()
        }))
        .filter((item) => item.label || item.value)
    }))
    .filter((section) => section.title || section.description || section.items.length > 0);

function SpecificationEditor({ value = [], onChange, compact = false }) {
  const sections = normalizeSpecSections(value);
  const updateSections = (next) => onChange(next);
  const handleValueKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.stopPropagation();
    }
  };

  const addSection = () => {
    updateSections([
      ...sections,
      { title: '', description: '', items: [{ label: '', value: '' }] }
    ]);
  };

  const removeSection = (index) => {
    updateSections(sections.filter((_, idx) => idx !== index));
  };

  const updateSectionField = (index, field, fieldValue) => {
    updateSections(
      sections.map((section, idx) =>
        idx === index ? { ...section, [field]: fieldValue } : section
      )
    );
  };

  const addItem = (sectionIndex) => {
    updateSections(
      sections.map((section, idx) =>
        idx === sectionIndex
          ? { ...section, items: [...(section.items || []), { label: '', value: '' }] }
          : section
      )
    );
  };

  const removeItem = (sectionIndex, itemIndex) => {
    updateSections(
      sections.map((section, idx) =>
        idx === sectionIndex
          ? { ...section, items: section.items.filter((_, itemIdx) => itemIdx !== itemIndex) }
          : section
      )
    );
  };

  const updateItem = (sectionIndex, itemIndex, field, fieldValue) => {
    updateSections(
      sections.map((section, idx) =>
        idx === sectionIndex
          ? {
              ...section,
              items: section.items.map((item, itemIdx) =>
                itemIdx === itemIndex ? { ...item, [field]: fieldValue } : item
              )
            }
          : section
      )
    );
  };

  return (
    <div className={`space-y-3 ${compact ? '' : 'bg-white border border-gray-200 rounded-xl p-4 shadow-sm'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-semibold">Технические характеристики</h4>
          <p className="text-xs text-muted">
            Разбейте характеристики по смысловым разделам. Каждый параметр лучше хранить отдельной строкой.
          </p>
        </div>
        <button type="button" className="button-gray text-sm" onClick={addSection}>
          Добавить раздел
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-4 text-sm text-muted">
          Разделы не добавлены.
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, sectionIndex) => {
            const items = Array.isArray(section.items) ? section.items : [];
            const sectionTitle = section.title?.trim() || `Раздел ${sectionIndex + 1}`;
            const itemsLabel = `${items.length} ${items.length === 1 ? 'параметр' : 'параметров'}`;
            return (
              <details
                key={`spec-${sectionIndex}`}
                className="rounded-xl border border-gray-200 bg-white/90 shadow-sm"
                open={sectionIndex === 0}
              >
                <summary className="cursor-pointer list-none px-3 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{sectionTitle}</p>
                    <p className="text-xs text-muted">{itemsLabel}</p>
                  </div>
                  <span className="text-xs text-muted">Открыть</span>
                </summary>

                <div className="px-3 pb-3 space-y-3 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2 pt-3">
                    <input
                      type="text"
                      placeholder="Название раздела"
                      value={section.title}
                      onChange={(e) => updateSectionField(sectionIndex, 'title', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                    <button
                      type="button"
                      className="button-gray text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => removeSection(sectionIndex)}
                    >
                      Удалить раздел
                    </button>
                  </div>

                  <details className="rounded-lg border border-gray-200 bg-secondary/40 px-3 py-2" open={Boolean(section.description)}>
                    <summary className="cursor-pointer text-xs font-medium text-muted">
                      Описание раздела (опционально)
                    </summary>
                    <textarea
                      placeholder="Например: рекомендации по уходу, состав, особенности материала"
                      value={section.description}
                      onChange={(e) => updateSectionField(sectionIndex, 'description', e.target.value)}
                      className="w-full mt-2 p-2 border border-gray-300 rounded min-h-[84px] bg-white"
                    />
                  </details>

                  <div className="space-y-2">
                    {items.map((item, itemIndex) => (
                      <div
                        key={`spec-${sectionIndex}-item-${itemIndex}`}
                        className="rounded-xl border border-ink/10 bg-white p-3"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-2">
                          <label className="text-xs text-muted">
                            <span className="mb-1 block">Параметр</span>
                            <input
                              type="text"
                              placeholder="Например: Размер"
                              value={item.label}
                              onChange={(e) => updateItem(sectionIndex, itemIndex, 'label', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded"
                            />
                          </label>
                          <label className="text-xs text-muted">
                            <span className="mb-1 block">Значение</span>
                            <textarea
                              placeholder="Например: Евро, 200x220 см"
                              value={item.value}
                              onChange={(e) => updateItem(sectionIndex, itemIndex, 'value', e.target.value)}
                              onKeyDown={handleValueKeyDown}
                              rows={3}
                              className="w-full p-2 border border-gray-300 rounded min-h-[84px] resize-y leading-relaxed"
                            />
                          </label>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            className="text-xs text-muted underline"
                            onClick={() => removeItem(sectionIndex, itemIndex)}
                          >
                            Удалить строку
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="button-gray text-xs"
                    onClick={() => addItem(sectionIndex)}
                  >
                    Добавить строку
                  </button>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}

const buildVariantFormState = (variants = []) =>
  (variants || []).reduce((acc, v) => {
    acc[v.id] = {
      name: v.name || '',
      price: v.price ? moneyToNumber(v.price) : '',
      stock: v.stock ?? v.stockQuantity ?? 0,
      currency: v.price?.currency || 'RUB',
      weightGrossG: v.weightGrossG ?? '',
      lengthMm: v.lengthMm ?? '',
      widthMm: v.widthMm ?? '',
      heightMm: v.heightMm ?? ''
    };
    return acc;
  }, {});

function CategoryPicker({ options = [], selected = [], onToggle, emptyLabel = 'Категории не найдены', className = '' }) {
  const selectedValues = Array.isArray(selected) ? selected : [];
  return (
    <div className={`rounded-xl border border-gray-200 bg-white/80 p-2 shadow-inner ${className}`}>
      {options.length === 0 ? (
        <p className="text-xs text-muted">{emptyLabel}</p>
      ) : (
        options.map((opt) => {
          const isSelected = selectedValues.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={`flex items-start gap-2 rounded-lg border px-2 py-1.5 text-sm transition ${
                isSelected
                  ? 'border-primary/30 bg-white shadow-sm'
                  : 'border-transparent hover:bg-secondary/60'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(opt.value)}
                className="mt-1 accent-primary"
              />
              <span className="leading-tight">{opt.label}</span>
            </label>
          );
        })
      )}
    </div>
  );
}

function BulkActionPill({
  menuKey,
  label,
  isActive,
  isOpen,
  onToggle,
  children,
  panelClassName = ''
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className={`list-none inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition cursor-pointer [&::-webkit-details-marker]:hidden ${
          isActive
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-ink/10 bg-white/90 text-ink'
        }`}
        onClick={() => onToggle(menuKey)}
        aria-expanded={isOpen}
      >
        <span>{label}</span>
        <span className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {isOpen && (
        <div
          className={`absolute left-0 mt-2 w-72 max-w-[90vw] rounded-2xl border border-ink/10 bg-white/95 p-4 shadow-xl z-20 ${panelClassName}`}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function AdminProducts() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [variantForms, setVariantForms] = useState({});
  const [uploadingImages, setUploadingImages] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploadTargets, setUploadTargets] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [variantEditForms, setVariantEditForms] = useState({});
  const [modalVariantForm, setModalVariantForm] = useState(EMPTY_VARIANT_FORM);
  const [newItem, setNewItem] = useState({
    name: '',
    slug: '',
    categories: [],
    brand: '',
    description: '',
    isActive: true,
    specifications: [],
    variantPrice: '',
    variantSku: '',
    variantStock: 0,
    variantCurrency: 'RUB',
    variantWeightGrossG: '',
    variantLengthMm: '',
    variantWidthMm: '',
    variantHeightMm: ''
  });
  const [newItemImages, setNewItemImages] = useState([]);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkCategories, setBulkCategories] = useState([]);
  const [bulkBrand, setBulkBrand] = useState(NO_BULK_BRAND);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [activeBulkMenu, setActiveBulkMenu] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });
  const [stockAdjustments, setStockAdjustments] = useState({});
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingVariant, setSavingVariant] = useState({});
  const [refreshingProductId, setRefreshingProductId] = useState(null);
  const [visibilityUpdating, setVisibilityUpdating] = useState({});
  const [bulkVisibilityUpdating, setBulkVisibilityUpdating] = useState(false);
  const initialEditSnapshotRef = useRef(null);
  const initialModalVariantRef = useRef(null);
  const bulkActionsRef = useRef(null);
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

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

  const MAX_IMAGE_SIZE_MB = 10;
  const MAX_IMAGE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

  const setUploadState = useCallback((productId, state, message = '', count = 0) => {
    if (!productId) return;
    setUploadStatus((prev) => ({
      ...prev,
      [productId]: { state, message, count, updatedAt: Date.now() }
    }));
  }, []);

  const buildEditSnapshot = useCallback((product) => {
    if (!product) return null;
    const categories = Array.isArray(product.categoryRefs) ? product.categoryRefs.slice().sort() : [];
    return {
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      brandRef: product.brandRef || '',
      categoryRefs: categories,
      specifications: normalizeSpecSections(product.specifications),
      isActive: product.isActive !== false
    };
  }, []);

  const normalizeVariantDraft = useCallback((form = {}) => {
    const rawPrice = form.price === null || form.price === undefined ? '' : String(form.price);
    const rawCurrency = (form.currency || 'RUB').trim();
    const rawSku = (form.sku || '').trim();
    const rawName = (form.name || '').trim();
    const rawStock = Number(form.stock || 0);
    const rawWeight = form.weightGrossG === null || form.weightGrossG === undefined ? '' : String(form.weightGrossG);
    const rawLength = form.lengthMm === null || form.lengthMm === undefined ? '' : String(form.lengthMm);
    const rawWidth = form.widthMm === null || form.widthMm === undefined ? '' : String(form.widthMm);
    const rawHeight = form.heightMm === null || form.heightMm === undefined ? '' : String(form.heightMm);
    return {
      sku: rawSku,
      name: rawName,
      price: rawPrice,
      stock: Number.isNaN(rawStock) ? 0 : rawStock,
      currency: rawCurrency || 'RUB',
      weightGrossG: rawWeight,
      lengthMm: rawLength,
      widthMm: rawWidth,
      heightMm: rawHeight
    };
  }, []);

  const categoryOptions = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    const byId = new Map(list.map((cat) => [cat.id, cat]));
    const buildPath = (cat) => {
      if (!cat) return '';
      const names = [cat.name || cat.slug || cat.id];
      let current = cat;
      let guard = 0;
      while (current?.parentId && guard < 20) {
        const parent = byId.get(current.parentId);
        if (!parent) break;
        names.unshift(parent.name || parent.slug || parent.id);
        current = parent;
        guard += 1;
      }
      return names.join(' / ');
    };
    return list
      .slice()
      .sort((a, b) => (a.fullPath || a.slug || '').localeCompare(b.fullPath || b.slug || ''))
      .map((cat) => ({
        value: cat.slug || cat.id,
        label: buildPath(cat),
        id: cat.id,
        slug: cat.slug
      }));
  }, [categories]);

  const categoryLabelByValue = useMemo(() => {
    const map = {};
    categoryOptions.forEach((opt) => {
      if (opt.value) map[opt.value] = opt.label;
      if (opt.id) map[opt.id] = opt.label;
      if (opt.slug) map[opt.slug] = opt.label;
    });
    return map;
  }, [categoryOptions]);

  const formatCategoryList = useCallback(
    (values) => {
      const refs = Array.isArray(values) ? values : values ? [values] : [];
      const labels = refs.map((ref) => categoryLabelByValue[ref] || ref).filter(Boolean);
      return labels.length ? labels.join(', ') : '—';
    },
    [categoryLabelByValue]
  );

  const toggleCategorySelection = useCallback((list, value) => {
    const current = Array.isArray(list) ? list : [];
    return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  }, []);

  const normalizeProduct = useCallback((product) => {
    const variants = Array.isArray(product.variants)
      ? product.variants
      : product.variants
      ? Array.from(product.variants)
      : [];
    const images = normalizeProductImages(product.images);
    const extractCategoryRef = (value) => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      return value.slug || value.id || '';
    };
    const categoryRefs = Array.isArray(product.categories)
      ? product.categories.map(extractCategoryRef).filter(Boolean)
      : [];
    if (categoryRefs.length === 0 && product.category) {
      const fallback = extractCategoryRef(product.category);
      if (fallback) categoryRefs.push(fallback);
    }
    return {
      ...product,
      variants,
      images,
      isActive: product?.isActive ?? product?.is_active ?? true,
      specifications: normalizeSpecSections(product.specifications),
      categoryRefs: Array.from(new Set(categoryRefs)),
      brandRef:
        typeof product.brand === 'string'
          ? product.brand
          : product.brand?.slug || product.brand?.id || ''
    };
  }, []);

  const refreshProduct = useCallback(
    async (productId, focusVariantId = null) => {
      if (!productId) return null;
      try {
        setRefreshingProductId(productId);
        const fresh = await getProduct(productId, { includeInactive: true });
        if (!fresh) return null;
        const normalized = normalizeProduct(fresh);
        setItems((prev) =>
          prev.map((p) => (p.id === productId ? normalized : p))
        );
        setEditingProduct((prev) => (prev && prev.id === productId ? normalized : prev));
        setVariantEditForms((prev) => {
          const next = { ...prev };
          const normalizedVariants = normalized.variants || [];
          normalizedVariants.forEach((v) => {
            const shouldReplace = focusVariantId ? v.id === focusVariantId || !next[v.id] : !next[v.id];
            if (shouldReplace) {
              next[v.id] = {
                name: v.name || '',
                price: v.price ? moneyToNumber(v.price) : '',
                stock: v.stock ?? v.stockQuantity ?? 0,
                currency: v.price?.currency || 'RUB',
                weightGrossG: v.weightGrossG ?? '',
                lengthMm: v.lengthMm ?? '',
                widthMm: v.widthMm ?? '',
                heightMm: v.heightMm ?? ''
              };
            }
          });
          Object.keys(next).forEach((key) => {
            if (!normalizedVariants.some((v) => `${v.id}` === `${key}`)) {
              delete next[key];
            }
          });
          return next;
        });
        return normalized;
      } catch (err) {
        console.error('Failed to refresh product:', err);
        return null;
      } finally {
        setRefreshingProductId(null);
      }
    },
    [normalizeProduct]
  );

  const loadProducts = useCallback(async () => {
    try {
      const data = await getProducts({ includeInactive: true });
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
        setNewItem((prev) => ({ ...prev, categories: prev.categories || [] }));
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

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!bulkActionsRef.current) return;
      if (!bulkActionsRef.current.contains(event.target)) {
        setActiveBulkMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!activeBulkMenu) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setActiveBulkMenu(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeBulkMenu]);

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

  const toggleBulkMenu = useCallback((menuKey) => {
    setActiveBulkMenu((prev) => (prev === menuKey ? null : menuKey));
  }, []);

  const closeBulkMenus = useCallback(() => {
    setActiveBulkMenu(null);
  }, []);

  const openEditModal = (product) => {
    const normalized = normalizeProduct(product);
    setEditingProduct({
      ...normalized,
      categoryRefs: normalized.categoryRefs || [],
      brandRef: normalized.brandRef || '',
      description: normalized.description || '',
      specifications: normalized.specifications || []
    });
    initialEditSnapshotRef.current = JSON.stringify(buildEditSnapshot(normalized));
    setVariantEditForms(buildVariantFormState(normalized.variants || []));
    const initialModalVariant = {
      ...EMPTY_VARIANT_FORM,
      sku: `${normalized.slug || 'sku'}-${normalized.variants?.length || 0}`
    };
    setModalVariantForm(initialModalVariant);
    initialModalVariantRef.current = JSON.stringify(normalizeVariantDraft(initialModalVariant));
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

  const buildProductPayload = (product, overrides = {}) => ({
    name: product?.name || '',
    description: product?.description || '',
    slug: product?.slug || '',
    categories: product?.categoryRefs || [],
    brand: product?.brandRef || undefined,
    specifications: sanitizeSpecSections(product?.specifications || []),
    isActive: product?.isActive !== false,
    ...overrides
  });

  const handleToggleVisibility = async (product) => {
    if (!product?.id) return;
    const currentIsActive = product.isActive !== false;
    const nextIsActive = !currentIsActive;
    setVisibilityUpdating((prev) => ({ ...prev, [product.id]: true }));
    try {
      await updateProduct(product.id, buildProductPayload(product, { isActive: nextIsActive }));
      setItems((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, isActive: nextIsActive } : item))
      );
      setEditingProduct((prev) =>
        prev && prev.id === product.id ? { ...prev, isActive: nextIsActive } : prev
      );
    } catch (err) {
      console.error('Failed to update product visibility:', err);
      alert('Не удалось изменить видимость товара. Попробуйте ещё раз.');
    } finally {
      setVisibilityUpdating((prev) => ({ ...prev, [product.id]: false }));
    }
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
        categories: newItem.categories || [],
        brand: newItem.brand || undefined,
        isActive: newItem.isActive !== false,
        specifications: sanitizeSpecSections(newItem.specifications)
      });
      await addProductVariant(created.id, {
        sku,
        name: newItem.name,
        amount,
        currency: newItem.variantCurrency || 'RUB',
        stock: Number(newItem.variantStock) || 0,
        weightGrossG: parseOptionalInt(newItem.variantWeightGrossG),
        lengthMm: parseOptionalInt(newItem.variantLengthMm),
        widthMm: parseOptionalInt(newItem.variantWidthMm),
        heightMm: parseOptionalInt(newItem.variantHeightMm)
      });
      if (newItemImages.length > 0) {
        await uploadProductImages(created.id, newItemImages);
      }
      await loadProducts();
      setNewItem({
        name: '',
        slug: '',
        categories: [],
        brand: '',
        description: '',
        isActive: true,
        specifications: [],
        variantPrice: '',
        variantSku: '',
        variantStock: 0,
        variantCurrency: 'RUB',
        variantWeightGrossG: '',
        variantLengthMm: '',
        variantWidthMm: '',
        variantHeightMm: ''
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
        stock: Number(form.stock) || 0,
        weightGrossG: parseOptionalInt(form.weightGrossG),
        lengthMm: parseOptionalInt(form.lengthMm),
        widthMm: parseOptionalInt(form.widthMm),
        heightMm: parseOptionalInt(form.heightMm)
      });
      await refreshProduct(productId);
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
      await refreshProduct(productId, variantId); // ensure UI reflects latest stock from backend
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

  const bumpVariantStock = (variantId, delta) => {
    setVariantEditForms((prev) => {
      const current = prev[variantId] || {};
      const currentValue = Number(current.stock ?? 0);
      const nextValue = Number.isNaN(currentValue) ? delta : currentValue + delta;
      return {
        ...prev,
        [variantId]: { ...current, stock: nextValue }
      };
    });
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
      setSavingVariant((prev) => ({ ...prev, [variantId]: true }));
      const payload = {
        name: form.name,
        amount,
        currency: form.currency || 'RUB',
        stock: Number(form.stock) || 0,
        weightGrossG: parseOptionalInt(form.weightGrossG),
        lengthMm: parseOptionalInt(form.lengthMm),
        widthMm: parseOptionalInt(form.widthMm),
        heightMm: parseOptionalInt(form.heightMm)
      };
      await updateProductVariant(productId, variantId, payload);
      setEditingProduct((prev) =>
        prev
          ? {
              ...prev,
              variants: prev.variants.map((v) =>
                v.id === variantId
                  ? {
                      ...v,
                      name: payload.name,
                      price: { amount, currency: payload.currency },
                      stock: payload.stock,
                      stockQuantity: payload.stock,
                      weightGrossG: payload.weightGrossG ?? v.weightGrossG,
                      lengthMm: payload.lengthMm ?? v.lengthMm,
                      widthMm: payload.widthMm ?? v.widthMm,
                      heightMm: payload.heightMm ?? v.heightMm
                    }
                  : v
              )
            }
          : prev
      );
      await refreshProduct(productId, variantId);
    } catch (err) {
      console.error('Failed to update variant:', err);
      alert('Не удалось сохранить вариант. Попробуйте ещё раз.');
    } finally {
      setSavingVariant((prev) => ({ ...prev, [variantId]: false }));
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
        stock: Number(modalVariantForm.stock) || 0,
        weightGrossG: parseOptionalInt(modalVariantForm.weightGrossG),
        lengthMm: parseOptionalInt(modalVariantForm.lengthMm),
        widthMm: parseOptionalInt(modalVariantForm.widthMm),
        heightMm: parseOptionalInt(modalVariantForm.heightMm)
      });
      setModalVariantForm(EMPTY_VARIANT_FORM);
      initialModalVariantRef.current = JSON.stringify(normalizeVariantDraft(EMPTY_VARIANT_FORM));
      await refreshProduct(editingProduct.id);
    } catch (err) {
      console.error('Failed to add variant:', err);
    }
  };

  const handleModalSave = async () => {
    if (!editingProduct) return;
    try {
      setSavingProduct(true);
      await updateProduct(editingProduct.id, buildProductPayload(editingProduct));
      const refreshed = await refreshProduct(editingProduct.id);
      if (refreshed) {
        initialEditSnapshotRef.current = JSON.stringify(buildEditSnapshot(refreshed));
      }
    } catch (err) {
      console.error('Failed to update product:', err);
      alert('Не удалось сохранить товар. Попробуйте ещё раз.');
    } finally {
      setSavingProduct(false);
    }
  };

  const closeConfirm = () => setConfirmDialog({ open: false, message: '', onConfirm: null });

  const handleUploadImages = async (productId, files, variantId = '') => {
    const list = Array.from(files || []);
    if (list.length === 0) return;
    const invalidFiles = list.filter((file) => !file.type.startsWith('image/'));
    const oversizedFiles = list.filter((file) => file.size > MAX_IMAGE_BYTES);
    const validFiles = list.filter(
      (file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_BYTES
    );
    if (validFiles.length === 0) {
      const reasonParts = [];
      if (invalidFiles.length) {
        reasonParts.push(`не изображение: ${invalidFiles.length}`);
      }
      if (oversizedFiles.length) {
        reasonParts.push(`слишком большие: ${oversizedFiles.length}`);
      }
      const reason = reasonParts.length ? `Причина: ${reasonParts.join(', ')}.` : '';
      setUploadState(
        productId,
        'error',
        `Файлы не загружены. ${reason || 'Проверьте формат и размер файла.'}`
      );
      alert('Не удалось загрузить изображения. Проверьте формат и размер файлов.');
      return;
    }
    const skippedNotes = [];
    if (invalidFiles.length) {
      skippedNotes.push(`не изображение: ${invalidFiles.length}`);
    }
    if (oversizedFiles.length) {
      skippedNotes.push(`слишком большие: ${oversizedFiles.length}`);
    }
    const skippedNote = skippedNotes.length ? ` Пропущено: ${skippedNotes.join(', ')}.` : '';
    setUploadState(productId, 'uploading', `Загружаем ${validFiles.length} шт…`);
    setUploadingImages((prev) => ({ ...prev, [productId]: true }));
    try {
      await uploadProductImages(productId, validFiles, { variantId: variantId || undefined });
      setUploadState(productId, 'syncing', 'Подтверждаем сохранение…');
      await refreshProduct(productId);
      setUploadState(
        productId,
        'done',
        `Готово: загружено ${validFiles.length} шт.${skippedNote}`
      );
    } catch (err) {
      console.error('Failed to upload product images:', err);
      setUploadState(
        productId,
        'error',
        'Ошибка загрузки. Проверьте соединение и попробуйте снова.'
      );
      alert('Не удалось загрузить изображения. Попробуйте ещё раз.');
    } finally {
      setUploadingImages((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleDeleteImage = async (productId, imageId) => {
    try {
      await deleteProductImage(productId, imageId);
      await refreshProduct(productId);
    } catch (err) {
      console.error('Failed to delete product image:', err);
    }
  };

  const handleUpdateImageVariant = async (productId, imageId, variantId) => {
    try {
      await updateProductImage(productId, imageId, { variantId: variantId || null });
      await refreshProduct(productId);
    } catch (err) {
      console.error('Failed to update image variant:', err);
      alert('Не удалось обновить привязку изображения к варианту.');
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

  const handleBulkVisibilityChange = async (isActive) => {
    if (selectedIds.length === 0) return;
    setBulkVisibilityUpdating(true);
    try {
      for (const id of selectedIds) {
        const product = items.find((p) => p.id === id);
        if (!product) continue;
        await updateProduct(id, buildProductPayload(product, { isActive }));
      }
      await loadProducts();
    } catch (err) {
      console.error('Failed to bulk update visibility', err);
      alert('Не удалось обновить видимость товаров. Попробуйте ещё раз.');
    } finally {
      setBulkVisibilityUpdating(false);
    }
  };

  const handleBulkCategoryChange = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      try {
        const product = items.find((p) => p.id === id);
        if (!product) continue;
        await updateProduct(id, buildProductPayload(product, { categories: bulkCategories }));
      } catch (err) {
        console.error('Failed to bulk change category for', id, err);
      }
    }
    await loadProducts();
  };

  const handleBulkBrandChange = async () => {
    if (selectedIds.length === 0 || bulkBrand === NO_BULK_BRAND) return;
    for (const id of selectedIds) {
      try {
        const product = items.find((p) => p.id === id);
        if (!product) continue;
        await updateProduct(id, buildProductPayload(product, { brand: bulkBrand || undefined }));
      } catch (err) {
        console.error('Failed to bulk change brand for', id, err);
      }
    }
    await loadProducts();
  };

  const handleBulkPriceChange = async () => {
    if (!bulkPrice || selectedIds.length === 0) return;
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

  const getCategoryName = useCallback((value) => formatCategoryList(value), [formatCategoryList]);

  const getBrandName = useCallback((value) => {
    if (!value) return '—';
    const match = brands.find((b) => b.slug === value || b.id === value);
    return match ? match.name : value;
  }, [brands]);

  const handleSortToggle = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key: null, direction: null };
      return { key, direction: 'asc' };
    });
    setPage(1);
  }, []);

  const resetSort = useCallback(() => {
    setSortConfig({ key: null, direction: null });
    setPage(1);
  }, []);

  const getSortMarker = useCallback(
    (key) => {
      if (sortConfig.key !== key) return '↕';
      if (sortConfig.direction === 'asc') return '▲';
      if (sortConfig.direction === 'desc') return '▼';
      return '↕';
    },
    [sortConfig]
  );

  const sortSummary = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return '';
    const fieldMap = {
      product: 'товару',
      categories: 'категориям',
      brand: 'бренду',
      variants: 'вариантам'
    };
    const directionMap = {
      asc: 'по возрастанию',
      desc: 'по убыванию'
    };
    const field = fieldMap[sortConfig.key] || 'товарам';
    const direction = directionMap[sortConfig.direction] || '';
    return `Сортировка: ${field} (${direction})`;
  }, [sortConfig]);

  const sortedItems = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return items;
    const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;
    const compareText = (a, b) =>
      String(a || '').localeCompare(String(b || ''), 'ru', { numeric: true, sensitivity: 'base' });

    const getSortValue = (item) => {
      if (!item) return '';
      if (sortConfig.key === 'product') {
        return `${item.name || ''} ${item.slug || ''}`.trim();
      }
      if (sortConfig.key === 'categories') {
        const label = formatCategoryList(item.categoryRefs);
        return label === '—' ? '' : label;
      }
      if (sortConfig.key === 'brand') {
        const label = getBrandName(item.brandRef);
        return label === '—' ? '' : label;
      }
      if (sortConfig.key === 'variants') {
        const primaryVariant = getPrimaryVariant(item);
        return primaryVariant?.price ? moneyToNumber(primaryVariant.price) : null;
      }
      return '';
    };

    return [...items].sort((a, b) => {
      const valueA = getSortValue(a);
      const valueB = getSortValue(b);

      if (typeof valueA === 'number' || typeof valueB === 'number') {
        if (valueA === null && valueB === null) return 0;
        if (valueA === null) return 1;
        if (valueB === null) return -1;
        if (valueA !== valueB) return (valueA - valueB) * directionMultiplier;
      } else {
        const textDiff = compareText(valueA, valueB);
        if (textDiff !== 0) return textDiff * directionMultiplier;
      }

      return compareText(a?.name, b?.name) * directionMultiplier;
    });
  }, [formatCategoryList, getBrandName, items, sortConfig]);

  const getVariantLabel = (product, variantId) => {
    if (!variantId) return 'Общие фото';
    const match = (product?.variants || []).find((v) => v.id === variantId);
    return match ? match.name || match.sku || variantId : variantId;
  };

  const renderUploadStatus = (productId, className = '') => {
    const status = uploadStatus[productId];
    if (!status || status.state === 'idle') return null;
    const message = status.message || '';
    if (status.state === 'error') {
      return <div className={`text-xs text-red-600 ${className}`}>{message}</div>;
    }
    if (status.state === 'done') {
      return <div className={`text-xs text-emerald-700 ${className}`}>{message || 'Загрузка завершена'}</div>;
    }
    const isSyncing = status.state === 'syncing';
    return (
      <div className={`flex items-center gap-2 text-xs text-primary ${className}`}>
        <span className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span>{message || (isSyncing ? 'Сохраняем изменения…' : 'Загружаем изображения…')}</span>
      </div>
    );
  };

  const renderVariantManagerContent = (product) => {
    const variantForm = variantForms[product.id] || EMPTY_VARIANT_FORM;
    return (
      <>
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Изображения</h4>
          {product.images && product.images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
              {product.images.map((img) => (
                <div key={img.id} className="relative rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                  <img src={img.url} alt={product.name} className="w-full h-28 object-cover" />
                  <div className="absolute top-2 left-2 bg-white/90 text-[11px] px-2 py-0.5 rounded-full border border-gray-200">
                    {getVariantLabel(product, img.variantId)}
                  </div>
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-white/90 text-xs px-1 rounded shadow"
                    onClick={() => handleDeleteImage(product.id, img.id)}
                  >
                    ✕
                  </button>
                  <div className="p-2 border-t border-gray-100">
                    <select
                      className="w-full text-xs border border-gray-300 rounded p-1"
                      value={img.variantId || ''}
                      onChange={(e) => handleUpdateImageVariant(product.id, img.id, e.target.value)}
                    >
                      <option value="">Общие фото</option>
                      {product.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted mb-3">Пока нет загруженных изображений.</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="p-2 border border-gray-300 rounded text-sm"
              value={uploadTargets[product.id] || ''}
              onChange={(e) =>
                setUploadTargets((prev) => ({ ...prev, [product.id]: e.target.value }))
              }
            >
              <option value="">Общие фото</option>
              {product.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <label
              className={`inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded text-sm bg-white ${
                uploadingImages[product.id] ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploadingImages[product.id]}
                onChange={(e) => {
                  handleUploadImages(product.id, e.target.files, uploadTargets[product.id]);
                  e.target.value = '';
                }}
              />
              {uploadingImages[product.id] ? 'Загружаем…' : 'Добавить изображения'}
            </label>
          </div>
          <div className="pt-2 space-y-1">
            {renderUploadStatus(product.id)}
            <p className="text-xs text-muted">
              PNG/JPG, до {MAX_IMAGE_SIZE_MB} MB. Можно оставить товар без фото и загрузить их позже. Выбор варианта выше
              привяжет фото к конкретному SKU.
            </p>
          </div>
        </div>
        <h4 className="font-semibold mb-2">Варианты товара</h4>
        {product.variants.length === 0 ? (
          <p className="text-sm text-muted">Пока нет созданных вариантов.</p>
        ) : (
          <>
            <div className="md:hidden space-y-3 mb-4">
              {product.variants.map((variant) => (
                <div key={variant.id} className="border border-gray-200 rounded-lg p-3 bg-white space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-muted">SKU {variant.sku}</p>
                      <p className="font-semibold break-words">{variant.name || 'Без названия'}</p>
                    </div>
                    <div className="text-sm font-semibold text-primary whitespace-nowrap">
                      {variant.price ? moneyToNumber(variant.price).toLocaleString('ru-RU') : '—'} ₽
                    </div>
                  </div>
                  <div className="text-sm text-muted">
                    Остаток: {variant.stock ?? variant.stockQuantity ?? '—'} шт.
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="+/-"
                      value={stockAdjustments[variant.id] ?? ''}
                      onChange={(e) => handleStockDeltaChange(variant.id, e.target.value)}
                      className="w-24"
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
                  <p className="text-xs text-muted">Используйте + / - для пополнения или списания</p>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
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
                            className="w-24"
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
          </>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVariantSubmit(product.id);
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
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
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <input
              type="number"
              placeholder="Вес, г"
              value={variantForm.weightGrossG}
              onChange={(e) => handleVariantFormChange(product.id, 'weightGrossG', e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
            <input
              type="number"
              placeholder="Длина, мм"
              value={variantForm.lengthMm}
              onChange={(e) => handleVariantFormChange(product.id, 'lengthMm', e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
            <input
              type="number"
              placeholder="Ширина, мм"
              value={variantForm.widthMm}
              onChange={(e) => handleVariantFormChange(product.id, 'widthMm', e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
            <input
              type="number"
              placeholder="Высота, мм"
              value={variantForm.heightMm}
              onChange={(e) => handleVariantFormChange(product.id, 'heightMm', e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
          </div>
        </form>
      </>
    );
  };

  const renderVariantManager = (product) => (
    <tr key={`${product.id}-variants`} className="bg-gray-50">
      <td colSpan={6} className="p-4">
        {renderVariantManagerContent(product)}
      </td>
    </tr>
  );

  const renderVariantManagerCard = (product) => (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
      {renderVariantManagerContent(product)}
    </div>
  );

  const editingVariants = editingProduct?.variants || [];
  const isVariantDirty = useCallback(
    (variant) => {
      if (!variant) return false;
      const form = variantEditForms[variant.id];
      if (!form) return false;
      const originalPrice = variant.price ? moneyToNumber(variant.price) : 0;
      const originalStock = Number(variant.stock ?? variant.stockQuantity ?? 0);
      const originalCurrency = variant.price?.currency || 'RUB';
      return (
        (form.name || '') !== (variant.name || '') ||
        Number(form.price || 0) !== Number(originalPrice || 0) ||
        Number(form.stock ?? 0) !== originalStock ||
        (form.currency || 'RUB') !== originalCurrency ||
        Number(form.weightGrossG || 0) !== Number(variant.weightGrossG || 0) ||
        Number(form.lengthMm || 0) !== Number(variant.lengthMm || 0) ||
        Number(form.widthMm || 0) !== Number(variant.widthMm || 0) ||
        Number(form.heightMm || 0) !== Number(variant.heightMm || 0)
      );
    },
    [variantEditForms]
  );
  const hasDirtyVariants = useMemo(
    () => editingVariants.some((variant) => isVariantDirty(variant)),
    [editingVariants, isVariantDirty]
  );
  const hasNewVariantInput = useMemo(() => {
    if (!initialModalVariantRef.current) return false;
    const normalized = normalizeVariantDraft(modalVariantForm || EMPTY_VARIANT_FORM);
    return JSON.stringify(normalized) !== initialModalVariantRef.current;
  }, [modalVariantForm, normalizeVariantDraft]);
  const hasUnsavedProductChanges = useMemo(() => {
    if (!editingProduct) return false;
    const snapshot = buildEditSnapshot(editingProduct);
    if (!snapshot) return false;
    if (!initialEditSnapshotRef.current) return false;
    return JSON.stringify(snapshot) !== initialEditSnapshotRef.current;
  }, [buildEditSnapshot, editingProduct]);
  const hasUnsavedChanges = hasUnsavedProductChanges || hasDirtyVariants || hasNewVariantInput;
  const totalStockForEditing = editingVariants.reduce(
    (sum, v) => sum + (Number(v.stock ?? v.stockQuantity) || 0),
    0
  );
  const primaryVariantForEditing = editingProduct ? getPrimaryVariant(editingProduct) : null;
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingProduct(null);
    setSavingProduct(false);
    setSavingVariant({});
    initialEditSnapshotRef.current = null;
    initialModalVariantRef.current = null;
  };
  const requestCloseEditModal = () => {
    if (!editingProduct) {
      closeEditModal();
      return;
    }
    if (uploadingImages[editingProduct.id]) {
      setConfirmDialog({
        open: true,
        message: 'Идёт загрузка изображений. Дождитесь завершения перед закрытием окна.',
        onConfirm: null
      });
      return;
    }
    if (hasUnsavedChanges) {
      setConfirmDialog({
        open: true,
        message: 'Есть несохранённые изменения. Закрыть без сохранения?',
        onConfirm: closeEditModal
      });
      return;
    }
    closeEditModal();
  };
  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedItems = sortedItems.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Управление товарами</h1>
        {sortSummary && (
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-primary">
              {sortSummary}
            </span>
            <button type="button" className="text-xs text-primary underline" onClick={resetSort}>
              Сбросить
            </button>
          </div>
        )}
      </div>
      <div className="border-y border-ink/10 py-4">
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted mb-3">Массовые действия</p>
        <div ref={bulkActionsRef} className="flex flex-wrap items-center gap-2">
          <BulkActionPill
            menuKey="selection"
            label={selectedIds.length > 0 ? `Выбор (${selectedIds.length})` : 'Выбор'}
            isActive={selectedIds.length > 0}
            isOpen={activeBulkMenu === 'selection'}
            onToggle={toggleBulkMenu}
          >
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Выбор</p>
              <label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={items.length > 0 && selectedIds.length === items.length}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
                <span>Выбрать все</span>
              </label>
              <div className="text-xs text-muted">Выбрано: {selectedIds.length}</div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  className="button text-sm w-full"
                  onClick={async () => {
                    await handleBulkVisibilityChange(true);
                    closeBulkMenus();
                  }}
                  disabled={selectedIds.length === 0 || bulkVisibilityUpdating}
                >
                  {bulkVisibilityUpdating ? 'Обновляем…' : 'Показать выбранные'}
                </button>
                <button
                  type="button"
                  className="button-gray text-sm w-full"
                  onClick={async () => {
                    await handleBulkVisibilityChange(false);
                    closeBulkMenus();
                  }}
                  disabled={selectedIds.length === 0 || bulkVisibilityUpdating}
                >
                  {bulkVisibilityUpdating ? 'Обновляем…' : 'Скрыть выбранные'}
                </button>
              </div>
              <button
                type="button"
                className="button-gray text-sm w-full"
                onClick={async () => {
                  await handleBulkDelete();
                  closeBulkMenus();
                }}
                disabled={selectedIds.length === 0}
              >
                Удалить выбранные
              </button>
            </div>
          </BulkActionPill>

          <BulkActionPill
            menuKey="categories"
            label={bulkCategories.length > 0 ? `Категории (${bulkCategories.length})` : 'Категории'}
            isActive={bulkCategories.length > 0}
            isOpen={activeBulkMenu === 'categories'}
            onToggle={toggleBulkMenu}
            panelClassName="w-[320px]"
          >
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Категории</p>
              <CategoryPicker
                options={categoryOptions}
                selected={bulkCategories}
                onToggle={(value) => setBulkCategories((prev) => toggleCategorySelection(prev, value))}
                emptyLabel="Категории ещё не созданы"
                className="max-h-36 overflow-y-auto"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="button text-sm w-full sm:w-auto"
                  onClick={async () => {
                    await handleBulkCategoryChange();
                    closeBulkMenus();
                  }}
                  disabled={selectedIds.length === 0}
                >
                  Применить
                </button>
                {bulkCategories.length > 0 && (
                  <button type="button" className="text-xs text-primary" onClick={() => setBulkCategories([])}>
                    Сбросить
                  </button>
                )}
              </div>
            </div>
          </BulkActionPill>

          <BulkActionPill
            menuKey="brand"
            label="Бренд"
            isActive={bulkBrand !== NO_BULK_BRAND}
            isOpen={activeBulkMenu === 'brand'}
            onToggle={toggleBulkMenu}
          >
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Бренд</p>
              <select
                value={bulkBrand}
                onChange={(e) => setBulkBrand(e.target.value)}
                className="w-full text-sm"
              >
                <option value={NO_BULK_BRAND}>Выберите бренд</option>
                <option value="">Без бренда</option>
                {brands.map((b) => (
                  <option key={b.slug || b.id} value={b.slug || b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="button text-sm w-full sm:w-auto"
                  onClick={async () => {
                    await handleBulkBrandChange();
                    closeBulkMenus();
                  }}
                  disabled={selectedIds.length === 0 || bulkBrand === NO_BULK_BRAND}
                >
                  Применить
                </button>
                {bulkBrand !== NO_BULK_BRAND && (
                  <button type="button" className="text-xs text-primary" onClick={() => setBulkBrand(NO_BULK_BRAND)}>
                    Сбросить
                  </button>
                )}
              </div>
            </div>
          </BulkActionPill>

          <BulkActionPill
            menuKey="price"
            label="Цена"
            isActive={Boolean(bulkPrice)}
            isOpen={activeBulkMenu === 'price'}
            onToggle={toggleBulkMenu}
          >
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Цена</p>
              <input
                type="number"
                step="0.01"
                placeholder="Новая цена"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="w-full text-sm"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="button text-sm w-full sm:w-auto"
                  onClick={async () => {
                    await handleBulkPriceChange();
                    closeBulkMenus();
                  }}
                  disabled={!bulkPrice || selectedIds.length === 0}
                >
                  Изменить цену
                </button>
                {bulkPrice && (
                  <button type="button" className="text-xs text-primary" onClick={() => setBulkPrice('')}>
                    Сбросить
                  </button>
                )}
              </div>
            </div>
          </BulkActionPill>
        </div>
        <p className="mt-3 text-xs text-muted">
          Массовые действия применяются к выделенным товарам. Цена меняется для основного варианта.
        </p>
      </div>
      <div className="md:hidden space-y-3">
        <div className="rounded-2xl border border-ink/10 bg-white/85 p-3 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Сортировка</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'product', label: 'Товар' },
              { key: 'categories', label: 'Категории' },
              { key: 'brand', label: 'Бренд' },
              { key: 'variants', label: 'Варианты' }
            ].map(({ key, label }) => {
              const isActive = sortConfig.key === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSortToggle(key)}
                  className={`rounded-xl border px-3 py-2 text-xs flex items-center justify-between transition ${
                    isActive
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-ink/10 bg-white text-ink'
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-[10px]">{getSortMarker(key)}</span>
                </button>
              );
            })}
          </div>
          {sortConfig.key && sortConfig.direction && (
            <button type="button" className="text-xs text-primary underline" onClick={resetSort}>
              Сбросить сортировку
            </button>
          )}
        </div>
        {pagedItems.map((item, index) => {
          const primaryVariant = getPrimaryVariant(item);
          const variantSummary = primaryVariant
            ? `${moneyToNumber(primaryVariant.price).toLocaleString('ru-RU')} ₽${
                item.variants.length > 1 ? ` · ${item.variants.length} шт.` : ''
              }`
            : 'Нет вариантов';
          return (
            <div
              key={item.id || index}
              className={`soft-card p-4 space-y-3 ${item.isActive === false ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-2 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold break-words leading-snug">{item.name}</span>
                      <span
                        className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                          item.isActive === false
                            ? 'border-red-200 text-red-600 bg-red-50'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        }`}
                      >
                        {item.isActive === false ? 'Скрыт' : 'Активен'}
                      </span>
                    </div>
                  </div>
                </label>
                <span className="text-[11px] text-muted text-right break-all max-w-[40%]">{item.slug}</span>
              </div>
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="text-muted text-xs block">Варианты</span>
                  <span>{variantSummary}</span>
                </div>
              </div>
              <details className="rounded-xl border border-ink/10 bg-white/80 p-3">
                <summary className="text-xs text-muted cursor-pointer">Детали товара</summary>
                <div className="mt-2 grid gap-2 text-sm">
                  <div>
                    <span className="text-muted text-xs block">Категории</span>
                    <span>{getCategoryName(item.categoryRefs)}</span>
                  </div>
                  <div>
                    <span className="text-muted text-xs block">Бренд</span>
                    <span>{getBrandName(item.brandRef)}</span>
                  </div>
                  <div>
                    <span className="text-muted text-xs block">Описание</span>
                    <span>{item.description ? `${item.description.substring(0, 80)}…` : '—'}</span>
                  </div>
                </div>
              </details>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => openEditModal(item)} className="button text-xs">
                  Редактировать
                </button>
                <button
                  onClick={() => handleToggleVisibility(item)}
                  className="button-gray text-xs"
                  disabled={visibilityUpdating[item.id]}
                >
                  {visibilityUpdating[item.id]
                    ? 'Обновляем…'
                    : item.isActive === false
                    ? 'Показать'
                    : 'Скрыть'}
                </button>
                <button onClick={() => handleDelete(index)} className="button-gray text-xs">
                  Удалить
                </button>
                <button
                  onClick={() => toggleVariants(item.id)}
                  className="text-gray-600 underline text-xs"
                >
                  {expandedProductId === item.id ? 'Скрыть варианты' : 'Варианты'}
                </button>
              </div>
              {expandedProductId === item.id && renderVariantManagerCard(item)}
            </div>
          );
        })}
        {pagedItems.length === 0 && (
          <div className="text-sm text-muted text-center">Товары не найдены</div>
        )}
      </div>

      <div className="hidden md:block">
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
              <th className="p-2 border-b">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-primary"
                  onClick={() => handleSortToggle('product')}
                >
                  <span>Товар</span>
                  <span className="text-[10px]">{getSortMarker('product')}</span>
                </button>
              </th>
              <th className="p-2 border-b">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-primary"
                  onClick={() => handleSortToggle('categories')}
                >
                  <span>Категории</span>
                  <span className="text-[10px]">{getSortMarker('categories')}</span>
                </button>
              </th>
              <th className="p-2 border-b">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-primary"
                  onClick={() => handleSortToggle('brand')}
                >
                  <span>Бренд</span>
                  <span className="text-[10px]">{getSortMarker('brand')}</span>
                </button>
              </th>
              <th className="p-2 border-b">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-primary"
                  onClick={() => handleSortToggle('variants')}
                >
                  <span>Варианты</span>
                  <span className="text-[10px]">{getSortMarker('variants')}</span>
                </button>
              </th>
              <th className="p-2 border-b">Действия</th>
            </tr>
          </thead>
          <tbody>
            {pagedItems.map((item, index) => {
              const primaryVariant = getPrimaryVariant(item);
              const variantSummary = primaryVariant
                ? `${moneyToNumber(primaryVariant.price).toLocaleString('ru-RU')} ₽${
                    item.variants.length > 1 ? ` · ${item.variants.length} шт.` : ''
                  }`
                : 'Нет вариантов';
              return (
                <React.Fragment key={item.id || index}>
                  <tr className={`border-b align-top ${item.isActive === false ? 'opacity-70' : ''}`}>
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold">{item.name}</div>
                        <span
                          className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                            item.isActive === false
                              ? 'border-red-200 text-red-600 bg-red-50'
                              : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                          }`}
                        >
                          {item.isActive === false ? 'Скрыт' : 'Активен'}
                        </span>
                      </div>
                      <div className="text-xs text-muted">{item.slug}</div>
                    </td>
                    <td className="p-2 text-xs text-muted">{getCategoryName(item.categoryRefs)}</td>
                    <td className="p-2 text-xs text-muted">{getBrandName(item.brandRef)}</td>
                    <td className="p-2">{variantSummary}</td>
                    <td className="p-2 space-y-1">
                      <button onClick={() => openEditModal(item)} className="text-primary block">
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(item)}
                        className="text-gray-600 block"
                        disabled={visibilityUpdating[item.id]}
                      >
                        {visibilityUpdating[item.id]
                          ? 'Обновляем…'
                          : item.isActive === false
                          ? 'Показать'
                          : 'Скрыть'}
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
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
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
          <span>Страница {page} / {totalPages}</span>
          <button
            className="button text-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Вперёд
          </button>
        </div>
      </div>
      {modalRoot && confirmDialog.open && createPortal(
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1500]"
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
        </div>,
        modalRoot
      )}
      {modalRoot && editModalOpen && editingProduct && createPortal(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1400] px-3 py-6"
          onClick={requestCloseEditModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[1120px] p-6 max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">Редактирование товара</h3>
                <p className="text-sm text-muted flex flex-wrap gap-2 items-center">
                  <span className="px-2 py-1 bg-secondary rounded text-xs">slug: {editingProduct.slug}</span>
                  <span className="px-2 py-1 bg-secondary rounded text-xs">Вариантов: {editingVariants.length}</span>
                  <span className="px-2 py-1 bg-secondary rounded text-xs">Запас: {totalStockForEditing} шт.</span>
                  {refreshingProductId === editingProduct.id ? (
                    <span className="text-primary text-xs animate-pulse">Обновляем данные…</span>
                  ) : (
                    <span className="text-green-700 text-xs">Данные актуальны</span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {hasUnsavedChanges ? (
                    <span className="px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                      Есть несохранённые изменения
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                      Все изменения сохранены
                    </span>
                  )}
                  {uploadingImages[editingProduct.id] && (
                    <span className="px-2 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
                      Загрузка изображений…
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="button-gray text-sm"
                  onClick={() => refreshProduct(editingProduct.id)}
                  disabled={refreshingProductId === editingProduct.id}
                >
                  Обновить
                </button>
                <button onClick={requestCloseEditModal} className="text-muted text-sm">
                  Закрыть
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 space-y-3">
                <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-secondary/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm">Основные данные</h4>
                    <span className="text-[11px] text-muted">Сохраняются без закрытия</span>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs text-muted block">
                      <span className="mb-1 block">Название</span>
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        placeholder="Название"
                        className="p-2 border border-gray-300 rounded w-full"
                      />
                    </label>
                    <label className="text-xs text-muted block">
                      <span className="mb-1 block">Slug</span>
                      <input
                        type="text"
                        value={editingProduct.slug}
                        onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                        placeholder="Slug"
                        className="p-2 border border-gray-300 rounded w-full"
                      />
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="text-xs text-muted block sm:col-span-2">
                        <span className="mb-1 block">Категории</span>
                        <CategoryPicker
                          options={categoryOptions}
                          selected={editingProduct.categoryRefs || []}
                          onToggle={(value) =>
                            setEditingProduct((prev) => ({
                              ...prev,
                              categoryRefs: toggleCategorySelection(prev.categoryRefs || [], value)
                            }))
                          }
                          emptyLabel="Категории ещё не созданы"
                          className="max-h-40 overflow-y-auto"
                        />
                        {(editingProduct.categoryRefs || []).length > 0 && (
                          <button
                            type="button"
                            onClick={() => setEditingProduct((prev) => ({ ...prev, categoryRefs: [] }))}
                            className="text-[11px] text-muted underline mt-1"
                          >
                            Сбросить категории
                          </button>
                        )}
                      </label>
                    <label className="text-xs text-muted block">
                      <span className="mb-1 block">Бренд</span>
                      <select
                        value={editingProduct.brandRef || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, brandRef: e.target.value })}
                        className="p-2 border border-gray-300 rounded w-full"
                      >
                        <option value="">Без бренда</option>
                        {brands.map((b) => (
                          <option key={b.slug || b.id} value={b.slug || b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={editingProduct.isActive !== false}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, isActive: e.target.checked })
                      }
                    />
                    <span>Показывать на сайте</span>
                  </label>
                </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white space-y-2">
                  <label className="block text-xs text-muted">
                    <span className="mb-1 block">Описание</span>
                    <textarea
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      placeholder="Короткое описание для карточки товара"
                      className="p-2 border border-gray-300 rounded w-full min-h-[120px]"
                    />
                  </label>
                  <p className="text-xs text-muted">
                    Изменения применяются после сохранения товара. Можно оставить пустым.
                  </p>
                </div>
              </div>
              <div className="lg:col-span-3 space-y-3">
                <details className="border border-gray-200 rounded-xl shadow-sm bg-white" open>
                  <summary className="cursor-pointer px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">Изображения</span>
                    <span className="text-xs text-muted">
                      {uploadingImages[editingProduct.id] ? 'Загружаем…' : 'Можно менять привязку к вариантам'}
                    </span>
                  </summary>
                  <div className="px-4 pb-4 space-y-3">
                  {editingProduct.images && editingProduct.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {editingProduct.images.map((img) => (
                        <div key={img.id} className="relative rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                          <img src={img.url} alt={editingProduct.name} className="w-full h-28 object-cover" />
                          <div className="absolute top-2 left-2 bg-white/90 text-[11px] px-2 py-0.5 rounded-full border border-gray-200">
                            {getVariantLabel(editingProduct, img.variantId)}
                          </div>
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-white/90 text-xs px-1 rounded shadow"
                            onClick={() => handleDeleteImage(editingProduct.id, img.id)}
                          >
                            ✕
                          </button>
                          <div className="p-2 border-t border-gray-100">
                            <select
                              className="w-full text-xs border border-gray-300 rounded p-1"
                              value={img.variantId || ''}
                              onChange={(e) => handleUpdateImageVariant(editingProduct.id, img.id, e.target.value)}
                            >
                              <option value="">Общие фото</option>
                              {editingProduct.variants.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted mb-3">Нет изображений</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <select
                      className="p-2 border border-gray-300 rounded text-sm"
                      value={uploadTargets[editingProduct.id] || ''}
                      onChange={(e) =>
                        setUploadTargets((prev) => ({ ...prev, [editingProduct.id]: e.target.value }))
                      }
                    >
                      <option value="">Общие фото</option>
                      {editingProduct.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                    <label
                      className={`inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded text-sm bg-white ${
                        uploadingImages[editingProduct.id]
                          ? 'cursor-not-allowed opacity-60'
                          : 'cursor-pointer hover:border-primary'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploadingImages[editingProduct.id]}
                        onChange={(e) => {
                          handleUploadImages(editingProduct.id, e.target.files, uploadTargets[editingProduct.id]);
                          e.target.value = '';
                        }}
                      />
                      {uploadingImages[editingProduct.id] ? 'Загружаем…' : 'Добавить изображения'}
                    </label>
                  </div>
                  <div className="pt-2 space-y-1">
                    {renderUploadStatus(editingProduct.id)}
                    <p className="text-xs text-muted">
                      PNG/JPG, до {MAX_IMAGE_SIZE_MB} MB. Изображения сохраняются автоматически после загрузки.
                    </p>
                  </div>
                  </div>
                </details>
                <details className="border border-gray-200 rounded-xl shadow-sm bg-white" open>
                  <summary className="cursor-pointer px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">Варианты и запасы</span>
                    {primaryVariantForEditing && (
                      <span className="px-3 py-1 bg-secondary rounded text-xs">
                        Базовая цена: {moneyToNumber(primaryVariantForEditing.price).toLocaleString('ru-RU')} ₽
                      </span>
                    )}
                  </summary>
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-xs text-muted">
                      Сохраняйте каждую строку отдельно. Быстрые кнопки корректируют остатки.
                    </p>
                    <div className="space-y-4">
                    {editingVariants.map((variant) => {
                      const form = variantEditForms[variant.id] || {};
                      const originalPrice = variant.price ? moneyToNumber(variant.price) : 0;
                      const originalStock = Number(variant.stock ?? variant.stockQuantity ?? 0);
                      const isDirty =
                        (form.name || '') !== (variant.name || '') ||
                        Number(form.price || 0) !== Number(originalPrice || 0) ||
                        Number(form.stock ?? 0) !== originalStock ||
                        (form.currency || 'RUB') !== (variant.price?.currency || 'RUB') ||
                        Number(form.weightGrossG || 0) !== Number(variant.weightGrossG || 0) ||
                        Number(form.lengthMm || 0) !== Number(variant.lengthMm || 0) ||
                        Number(form.widthMm || 0) !== Number(variant.widthMm || 0) ||
                        Number(form.heightMm || 0) !== Number(variant.heightMm || 0);
                      return (
                        <div key={variant.id} className="rounded-2xl border border-gray-200 bg-white/85 p-4 shadow-sm">
                          <div className="flex flex-wrap justify-between items-start gap-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted">SKU {variant.sku}</p>
                              <p className="font-semibold">{variant.name || 'Без названия'}</p>
                              <p className="text-[11px] text-muted">ID: {variant.id}</p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${isDirty ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                {isDirty ? 'Есть изменения' : 'Актуально'}
                              </span>
                              <button
                                type="button"
                                className={`button text-sm ${savingVariant[variant.id] ? 'opacity-70 cursor-not-allowed' : ''}`}
                                onClick={() => handleSaveVariant(editingProduct.id, variant.id)}
                                disabled={savingVariant[variant.id]}
                              >
                                {savingVariant[variant.id] ? 'Сохраняем…' : 'Сохранить вариант'}
                              </button>
                              {savingVariant[variant.id] && (
                                <span className="text-primary text-xs animate-pulse">Сохраняем…</span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                            <label className="block text-xs text-muted">
                              <span className="mb-1 block">Название</span>
                              <input
                                type="text"
                                value={form.name || ''}
                                onChange={(e) => handleVariantEditChange(variant.id, 'name', e.target.value)}
                                className="p-2 border border-gray-300 rounded w-full"
                                disabled={savingVariant[variant.id]}
                              />
                            </label>
                            <label className="block text-xs text-muted">
                              <span className="mb-1 block">Цена, ₽</span>
                              <input
                                type="number"
                                step="0.01"
                                value={form.price || ''}
                                onChange={(e) => handleVariantEditChange(variant.id, 'price', e.target.value)}
                                className="p-2 border border-gray-300 rounded w-full"
                                disabled={savingVariant[variant.id]}
                              />
                              <span className="text-[11px] text-muted mt-1 block">
                                Текущее: {originalPrice.toLocaleString('ru-RU')} ₽
                              </span>
                            </label>
                            <label className="block text-xs text-muted">
                              <span className="mb-1 block">Количество</span>
                              <input
                                type="number"
                                value={form.stock ?? 0}
                                onChange={(e) => handleVariantEditChange(variant.id, 'stock', e.target.value)}
                                className="p-2 border border-gray-300 rounded w-full"
                                disabled={savingVariant[variant.id]}
                              />
                            </label>
                            <label className="block text-xs text-muted">
                              <span className="mb-1 block">Валюта</span>
                              <input
                                type="text"
                                value={form.currency || 'RUB'}
                                onChange={(e) => handleVariantEditChange(variant.id, 'currency', e.target.value)}
                                className="p-2 border border-gray-300 rounded w-full"
                                disabled={savingVariant[variant.id]}
                              />
                            </label>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-1">
                            <span className="text-[11px] text-muted mr-1">Быстрые изменения запаса:</span>
                            {[-5, -1, 1, 5].map((step) => (
                              <button
                                key={step}
                                type="button"
                                className="px-2 py-1 border border-gray-200 rounded text-xs hover:bg-secondary"
                                onClick={() => bumpVariantStock(variant.id, step)}
                                disabled={savingVariant[variant.id]}
                              >
                                {step > 0 ? `+${step}` : step}
                              </button>
                            ))}
                          </div>

                          <details className="mt-3 rounded-xl border border-gray-200 bg-secondary/35 px-3 py-2">
                            <summary className="cursor-pointer text-xs font-medium text-muted">
                              Вес и габариты (опционально)
                            </summary>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                              <label className="block text-xs text-muted">
                                <span className="mb-1 block">Вес, г</span>
                                <input
                                  type="number"
                                  value={form.weightGrossG ?? ''}
                                  onChange={(e) => handleVariantEditChange(variant.id, 'weightGrossG', e.target.value)}
                                  className="p-2 border border-gray-300 rounded w-full"
                                  disabled={savingVariant[variant.id]}
                                />
                              </label>
                              <label className="block text-xs text-muted">
                                <span className="mb-1 block">Длина, мм</span>
                                <input
                                  type="number"
                                  value={form.lengthMm ?? ''}
                                  onChange={(e) => handleVariantEditChange(variant.id, 'lengthMm', e.target.value)}
                                  className="p-2 border border-gray-300 rounded w-full"
                                  disabled={savingVariant[variant.id]}
                                />
                              </label>
                              <label className="block text-xs text-muted">
                                <span className="mb-1 block">Ширина, мм</span>
                                <input
                                  type="number"
                                  value={form.widthMm ?? ''}
                                  onChange={(e) => handleVariantEditChange(variant.id, 'widthMm', e.target.value)}
                                  className="p-2 border border-gray-300 rounded w-full"
                                  disabled={savingVariant[variant.id]}
                                />
                              </label>
                              <label className="block text-xs text-muted">
                                <span className="mb-1 block">Высота, мм</span>
                                <input
                                  type="number"
                                  value={form.heightMm ?? ''}
                                  onChange={(e) => handleVariantEditChange(variant.id, 'heightMm', e.target.value)}
                                  className="p-2 border border-gray-300 rounded w-full"
                                  disabled={savingVariant[variant.id]}
                                />
                              </label>
                            </div>
                          </details>
                        </div>
                      );
                    })}
                    {editingVariants.length === 0 && (
                      <p className="text-sm text-muted">Добавьте варианты ниже.</p>
                    )}
                    <div className="pt-3">
                      <p className="text-xs text-muted mb-2">Новый вариант</p>
                      <div className="border border-dashed border-gray-300 rounded-lg p-3 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
                          <label className="text-xs text-muted block">
                            <span className="mb-1 block">SKU</span>
                            <input
                              type="text"
                              placeholder="SKU"
                              value={modalVariantForm.sku}
                              onChange={(e) => handleModalVariantChange('sku', e.target.value)}
                              className="p-2 border border-gray-300 rounded w-full"
                            />
                          </label>
                          <label className="text-xs text-muted block">
                            <span className="mb-1 block">Название</span>
                            <input
                              type="text"
                              placeholder="Название"
                              value={modalVariantForm.name}
                              onChange={(e) => handleModalVariantChange('name', e.target.value)}
                              className="p-2 border border-gray-300 rounded w-full"
                            />
                          </label>
                          <label className="text-xs text-muted block">
                            <span className="mb-1 block">Цена</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Цена"
                              value={modalVariantForm.price}
                              onChange={(e) => handleModalVariantChange('price', e.target.value)}
                              className="p-2 border border-gray-300 rounded w-full"
                            />
                          </label>
                          <label className="text-xs text-muted block">
                            <span className="mb-1 block">Остаток</span>
                            <input
                              type="number"
                              placeholder="Остаток"
                              value={modalVariantForm.stock}
                              onChange={(e) => handleModalVariantChange('stock', e.target.value)}
                              className="p-2 border border-gray-300 rounded w-full"
                            />
                          </label>
                          <label className="text-xs text-muted block">
                            <span className="mb-1 block">Валюта</span>
                            <input
                              type="text"
                              placeholder="Валюта"
                              value={modalVariantForm.currency}
                              onChange={(e) => handleModalVariantChange('currency', e.target.value)}
                              className="p-2 border border-gray-300 rounded w-full"
                            />
                          </label>
                        </div>
                        <details className="rounded-lg border border-gray-200 bg-secondary/35 px-3 py-2">
                          <summary className="cursor-pointer text-xs font-medium text-muted">
                            Вес и габариты (опционально)
                          </summary>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <input
                              type="number"
                              placeholder="Вес, г"
                              value={modalVariantForm.weightGrossG}
                              onChange={(e) => handleModalVariantChange('weightGrossG', e.target.value)}
                              className="p-2 border border-gray-300 rounded"
                            />
                            <input
                              type="number"
                              placeholder="Длина, мм"
                              value={modalVariantForm.lengthMm}
                              onChange={(e) => handleModalVariantChange('lengthMm', e.target.value)}
                              className="p-2 border border-gray-300 rounded"
                            />
                            <input
                              type="number"
                              placeholder="Ширина, мм"
                              value={modalVariantForm.widthMm}
                              onChange={(e) => handleModalVariantChange('widthMm', e.target.value)}
                              className="p-2 border border-gray-300 rounded"
                            />
                            <input
                              type="number"
                              placeholder="Высота, мм"
                              value={modalVariantForm.heightMm}
                              onChange={(e) => handleModalVariantChange('heightMm', e.target.value)}
                              className="p-2 border border-gray-300 rounded"
                            />
                          </div>
                        </details>
                        <div className="flex justify-end">
                          <button type="button" className="button text-sm" onClick={handleAddVariantInModal}>
                            Добавить вариант
                          </button>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
            <SpecificationEditor
              value={editingProduct.specifications || []}
              onChange={(next) =>
                setEditingProduct((prev) => (prev ? { ...prev, specifications: next } : prev))
              }
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted">
                Сначала сохраняйте варианты, затем товар, чтобы зафиксировать SEO-поля.
              </p>
              <div className="flex justify-end gap-2">
                <button className="button-gray" onClick={requestCloseEditModal}>Отмена</button>
                <button
                  className="button"
                  onClick={handleModalSave}
                  disabled={savingProduct || refreshingProductId === editingProduct.id}
                >
                  {savingProduct ? 'Сохраняем…' : 'Сохранить товар'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        modalRoot
      )}
      <details className="bg-white/80 border border-gray-200 rounded-2xl shadow-sm" open>
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-ink">
          Добавить новый товар
        </summary>
        <form onSubmit={handleAddNew} className="px-5 pb-5 space-y-2 max-w-3xl">
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
          <div className="space-y-2">
            <label className="text-xs text-muted block">
              <span className="mb-1 block">Категории</span>
              <CategoryPicker
                options={categoryOptions}
                selected={newItem.categories || []}
                onToggle={(value) =>
                  setNewItem((prev) => ({
                    ...prev,
                    categories: toggleCategorySelection(prev.categories || [], value)
                  }))
                }
                emptyLabel="Категории ещё не созданы"
                className="max-h-36 overflow-y-auto"
              />
              {(newItem.categories || []).length > 0 && (
                <button
                  type="button"
                  onClick={() => setNewItem((prev) => ({ ...prev, categories: [] }))}
                  className="text-[11px] text-muted underline mt-1"
                >
                  Сбросить категории
                </button>
              )}
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
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
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={newItem.isActive !== false}
              onChange={(e) => setNewItem({ ...newItem, isActive: e.target.checked })}
            />
            <span>Показывать на сайте</span>
          </label>
          <SpecificationEditor
            value={newItem.specifications || []}
            onChange={(next) => setNewItem((prev) => ({ ...prev, specifications: next }))}
            compact
          />
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input
              type="number"
              placeholder="Вес, г"
              value={newItem.variantWeightGrossG}
              onChange={(e) => setNewItem({ ...newItem, variantWeightGrossG: e.target.value })}
              className="p-2 border border-gray-300 rounded"
            />
            <input
              type="number"
              placeholder="Длина, мм"
              value={newItem.variantLengthMm}
              onChange={(e) => setNewItem({ ...newItem, variantLengthMm: e.target.value })}
              className="p-2 border border-gray-300 rounded"
            />
            <input
              type="number"
              placeholder="Ширина, мм"
              value={newItem.variantWidthMm}
              onChange={(e) => setNewItem({ ...newItem, variantWidthMm: e.target.value })}
              className="p-2 border border-gray-300 rounded"
            />
            <input
              type="number"
              placeholder="Высота, мм"
              value={newItem.variantHeightMm}
              onChange={(e) => setNewItem({ ...newItem, variantHeightMm: e.target.value })}
              className="p-2 border border-gray-300 rounded"
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
      </details>
    </div>
  );
}

export default AdminProducts;
