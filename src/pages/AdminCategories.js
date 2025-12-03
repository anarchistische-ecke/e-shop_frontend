import React, { useState, useEffect, useCallback } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' });
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
        description: cat.description
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
        description: newCategory.description || ''
      });
      setCategories((prev) => [...prev, created]);
      setNewCategory({ name: '', slug: '', description: '' });
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 align-top">
          <thead className="bg-secondary">
            <tr>
              <th className="p-2 border-b text-left">Название</th>
              <th className="p-2 border-b text-left">Slug</th>
              <th className="p-2 border-b text-left">Описание</th>
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
                    <input 
                      type="text" 
                      value={cat.description || ''} 
                      onChange={(e) => handleEditChange(cat.id, 'description', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
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
                  <td className="p-2">{cat.description ? cat.description.substring(0, 40) + '…' : ''}</td>
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
        <button type="submit" className="button">Добавить</button>
      </form>
    </div>
  );
}

export default AdminCategories;
