import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api';
import { resolveImageUrl } from '../utils/product';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    parentId: ''
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

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

  const load = useCallback(() => {
    setLoading(true);
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        value: cat.id,
        label: buildPath(cat)
      }));
  }, [categories]);

  const categoryLabelById = useMemo(() => {
    const map = {};
    categoryOptions.forEach((opt) => {
      map[opt.value] = opt.label;
    });
    return map;
  }, [categoryOptions]);

  const getCategoryLabel = useCallback(
    (value) => {
      if (!value) return '—';
      return categoryLabelById[value] || value;
    },
    [categoryLabelById]
  );

  const handleEditChange = (id, field, value) => {
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, [field]: value } : cat)));
  };

  const handleSave = async (id) => {
    try {
      const cat = categories.find((c) => c.id === id);
      if (!cat) return;
      await updateCategory(cat.id, {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl || '',
        parentId: cat.parentId || null
      });
      load();
    } catch (err) {
      console.error('Failed to update category:', err);
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      const cat = categories.find((c) => c.id === id);
      if (!cat) return;
      if (!window.confirm(`Удалить категорию "${cat.name}"?`)) return;
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  const handleAddNew = async (e) => {
    e.preventDefault();
    if (!newCategory.name || !newCategory.slug) return;
    try {
      const created = await createCategory({
        name: newCategory.name,
        slug: newCategory.slug,
        description: newCategory.description || '',
        imageUrl: newCategory.imageUrl || '',
        parentId: newCategory.parentId || null
      });
      setCategories((prev) => [...prev, created]);
      setNewCategory({ name: '', slug: '', description: '', imageUrl: '', parentId: '' });
    } catch (err) {
      console.error('Failed to create category:', err);
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Категории</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Поиск по названию или slug"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] p-2 border border-gray-300 rounded"
        />
        <div className="text-sm text-muted">
          Всего: {categories.length} · Показано: {filtered.length}
        </div>
        <button className="button-gray text-sm" onClick={load} disabled={loading}>
          {loading ? 'Обновляем...' : 'Обновить'}
        </button>
      </div>
      <div className="md:hidden space-y-3">
        {filtered.map((cat, index) => (
          <div key={cat.id || index} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm space-y-2">
            <div>
              <span className="text-xs text-muted block">Название</span>
              {editingId === cat.id ? (
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => handleEditChange(cat.id, 'name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              ) : (
                <span className="font-semibold">{cat.name}</span>
              )}
            </div>
            <div>
              <span className="text-xs text-muted block">Slug</span>
              {editingId === cat.id ? (
                <input
                  type="text"
                  value={cat.slug}
                  onChange={(e) => handleEditChange(cat.id, 'slug', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              ) : (
                <span>{cat.slug}</span>
              )}
            </div>
            <div>
              <span className="text-xs text-muted block">Родитель</span>
              {editingId === cat.id ? (
                <select
                  value={cat.parentId || ''}
                  onChange={(e) => handleEditChange(cat.id, 'parentId', e.target.value || null)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">Без родителя</option>
                  {categoryOptions
                    .filter((opt) => opt.value !== cat.id)
                    .map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                </select>
              ) : (
                <span>{getCategoryLabel(cat.parentId)}</span>
              )}
            </div>
            <div>
              <span className="text-xs text-muted block">Описание</span>
              {editingId === cat.id ? (
                <input
                  type="text"
                  value={cat.description || ''}
                  onChange={(e) => handleEditChange(cat.id, 'description', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              ) : (
                <span>{cat.description ? cat.description.substring(0, 80) + '…' : '—'}</span>
              )}
            </div>
            <div>
              <span className="text-xs text-muted block">Фото</span>
              {editingId === cat.id ? (
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={cat.imageUrl || ''}
                    onChange={(e) => handleEditChange(cat.id, 'imageUrl', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  {cat.imageUrl ? (
                    <img
                      src={resolveImageUrl(cat.imageUrl)}
                      alt={cat.name}
                      className="h-20 w-full rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </div>
              ) : cat.imageUrl ? (
                <img
                  src={resolveImageUrl(cat.imageUrl)}
                  alt={cat.name}
                  className="h-16 w-full rounded-lg object-cover border border-gray-200"
                />
              ) : (
                <span>—</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {editingId === cat.id ? (
                <>
                  <button onClick={() => handleSave(cat.id)} className="button text-xs">
                    Сохранить
                  </button>
                  <button onClick={() => setEditingId(null)} className="button-gray text-xs">
                    Отмена
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditingId(cat.id)} className="button text-xs">
                    Редактировать
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="button-gray text-xs">
                    Удалить
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-muted text-center">Категории не найдены</div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 align-top">
          <thead className="bg-secondary">
            <tr>
              <th className="p-2 border-b text-left">Название</th>
              <th className="p-2 border-b text-left">Slug</th>
              <th className="p-2 border-b text-left">Родитель</th>
              <th className="p-2 border-b text-left">Описание</th>
              <th className="p-2 border-b text-left">Фото</th>
              <th className="p-2 border-b text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cat, index) => (
              <tr key={cat.id || index} className="border-b align-top">
              {editingId === cat.id ? (
                <>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={cat.name} 
                      onChange={(e) => handleEditChange(cat.id, 'name', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={cat.slug} 
                      onChange={(e) => handleEditChange(cat.id, 'slug', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={cat.parentId || ''}
                      onChange={(e) => handleEditChange(cat.id, 'parentId', e.target.value || null)}
                      className="w-full p-1 border border-gray-300 rounded"
                    >
                      <option value="">Без родителя</option>
                      {categoryOptions
                        .filter((opt) => opt.value !== cat.id)
                        .map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={cat.description || ''} 
                      onChange={(e) => handleEditChange(cat.id, 'description', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <div className="space-y-2">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={cat.imageUrl || ''}
                        onChange={(e) => handleEditChange(cat.id, 'imageUrl', e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                      {cat.imageUrl ? (
                        <img
                          src={resolveImageUrl(cat.imageUrl)}
                          alt={cat.name}
                          className="h-16 w-24 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <button onClick={() => handleSave(cat.id)} className="text-primary mr-2">
                      Сохранить
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-500">
                      Отмена
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="p-2">{cat.name}</td>
                  <td className="p-2">{cat.slug}</td>
                  <td className="p-2">{getCategoryLabel(cat.parentId)}</td>
                  <td className="p-2">{cat.description ? cat.description.substring(0, 40) + '…' : ''}</td>
                  <td className="p-2">
                    {cat.imageUrl ? (
                      <img
                        src={resolveImageUrl(cat.imageUrl)}
                        alt={cat.name}
                        className="h-12 w-16 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="p-2">
                    <button onClick={() => setEditingId(cat.id)} className="text-primary mr-2">
                      Редактировать
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="text-red-600">
                      Удалить
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold">Добавить категорию</h2>
      <form onSubmit={handleAddNew} className="space-y-2 max-w-lg">
        <input 
          type="text" 
          placeholder="Название" 
          value={newCategory.name} 
          onChange={(e) => {
            const name = e.target.value;
            const autoSlug =
              !newCategory.slug || newCategory.slug === slugify(newCategory.name)
                ? slugify(name)
                : newCategory.slug;
            setNewCategory({ ...newCategory, name, slug: autoSlug });
          }} 
          className="w-full p-2 border border-gray-300 rounded"
          required 
        />
        <input 
          type="text" 
          placeholder="Slug (англ. буквы)" 
          value={newCategory.slug} 
          onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value || slugify(newCategory.name) })} 
          className="w-full p-2 border border-gray-300 rounded"
          required 
        />
        <input 
          type="text" 
          placeholder="Описание (необязательно)" 
          value={newCategory.description} 
          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} 
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="url"
          placeholder="Ссылка на изображение (https://...)"
          value={newCategory.imageUrl}
          onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <select
          value={newCategory.parentId}
          onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Без родителя</option>
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button type="submit" className="button">Добавить</button>
      </form>
    </div>
  );
}

export default AdminCategories;
