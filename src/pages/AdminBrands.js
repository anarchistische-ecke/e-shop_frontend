import React, { useState, useEffect, useCallback } from 'react';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../api';

function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newBrand, setNewBrand] = useState({ name: '', slug: '', description: '' });
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
    getBrands()
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch brands:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEditChange = (id, field, value) => {
    setBrands((prev) => prev.map((brand) => (brand.id === id ? { ...brand, [field]: value } : brand)));
  };

  const handleSave = async (id) => {
    try {
      const brand = brands.find((b) => b.id === id);
      if (!brand) return;
      await updateBrand(brand.id, {
        name: brand.name,
        slug: brand.slug,
        description: brand.description
      });
      load();
    } catch (err) {
      console.error('Failed to update brand:', err);
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      const brand = brands.find((b) => b.id === id);
      if (!brand) return;
      if (!window.confirm(`Удалить бренд "${brand.name}"?`)) return;
      await deleteBrand(brand.id);
      setBrands((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Failed to delete brand:', err);
    }
  };

  const handleAddNew = async (e) => {
    e.preventDefault();
    if (!newBrand.name || !newBrand.slug) return;
    try {
      const created = await createBrand({
        name: newBrand.name,
        slug: newBrand.slug,
        description: newBrand.description || ''
      });
      setBrands((prev) => [...prev, created]);
      setNewBrand({ name: '', slug: '', description: '' });
    } catch (err) {
      console.error('Failed to create brand:', err);
    }
  };

  const filtered = brands.filter(
    (b) =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Бренды</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Поиск по названию или slug"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] p-2 border border-gray-300 rounded"
        />
        <div className="text-sm text-muted">
          Всего: {brands.length} · Показано: {filtered.length}
        </div>
        <button className="button-gray text-sm" onClick={load} disabled={loading}>
          {loading ? 'Обновляем...' : 'Обновить'}
        </button>
      </div>
      <div className="md:hidden space-y-3">
        {filtered.map((brand, index) => (
          <div key={brand.id || index} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm space-y-2">
            <div>
              <span className="text-xs text-muted block">Название</span>
              {editingId === brand.id ? (
                <input
                  type="text"
                  value={brand.name}
                  onChange={(e) => handleEditChange(brand.id, 'name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              ) : (
                <span className="font-semibold">{brand.name}</span>
              )}
            </div>
            <div>
              <span className="text-xs text-muted block">Slug</span>
              {editingId === brand.id ? (
                <input
                  type="text"
                  value={brand.slug}
                  onChange={(e) => handleEditChange(brand.id, 'slug', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              ) : (
                <span>{brand.slug}</span>
              )}
            </div>
            <div>
              <span className="text-xs text-muted block">Описание</span>
              {editingId === brand.id ? (
                <input
                  type="text"
                  value={brand.description || ''}
                  onChange={(e) => handleEditChange(brand.id, 'description', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              ) : (
                <span>{brand.description ? brand.description.substring(0, 80) + '…' : '—'}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {editingId === brand.id ? (
                <>
                  <button onClick={() => handleSave(brand.id)} className="button text-xs">
                    Сохранить
                  </button>
                  <button onClick={() => setEditingId(null)} className="button-gray text-xs">
                    Отмена
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditingId(brand.id)} className="button text-xs">
                    Редактировать
                  </button>
                  <button onClick={() => handleDelete(brand.id)} className="button-gray text-xs">
                    Удалить
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-muted text-center">Бренды не найдены</div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
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
            {filtered.map((brand, index) => (
              <tr key={brand.id || index} className="border-b align-top">
              {editingId === brand.id ? (
                <>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={brand.name} 
                      onChange={(e) => handleEditChange(brand.id, 'name', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={brand.slug} 
                      onChange={(e) => handleEditChange(brand.id, 'slug', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={brand.description || ''} 
                      onChange={(e) => handleEditChange(brand.id, 'description', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <button onClick={() => handleSave(brand.id)} className="text-primary mr-2">
                      Сохранить
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-500">
                      Отмена
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="p-2">{brand.name}</td>
                  <td className="p-2">{brand.slug}</td>
                  <td className="p-2">{brand.description ? brand.description.substring(0, 40) + '…' : ''}</td>
                  <td className="p-2">
                    <button onClick={() => setEditingId(brand.id)} className="text-primary mr-2">
                      Редактировать
                    </button>
                    <button onClick={() => handleDelete(brand.id)} className="text-red-600">
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

      <h2 className="text-xl font-semibold">Добавить бренд</h2>
      <form onSubmit={handleAddNew} className="space-y-2 max-w-lg">
        <input 
          type="text" 
          placeholder="Название бренда" 
          value={newBrand.name} 
          onChange={(e) => {
            const name = e.target.value;
            const autoSlug =
              !newBrand.slug || newBrand.slug === slugify(newBrand.name)
                ? slugify(name)
                : newBrand.slug;
            setNewBrand({ ...newBrand, name, slug: autoSlug });
          }} 
          className="w-full p-2 border border-gray-300 rounded"
          required 
        />
        <input 
          type="text" 
          placeholder="Slug (англ. буквы)" 
          value={newBrand.slug} 
          onChange={(e) => setNewBrand({ ...newBrand, slug: e.target.value || slugify(newBrand.name) })} 
          className="w-full p-2 border border-gray-300 rounded"
          required 
        />
        <input 
          type="text" 
          placeholder="Описание (необязательно)" 
          value={newBrand.description} 
          onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })} 
          className="w-full p-2 border border-gray-300 rounded"
        />
        <button type="submit" className="button">Добавить</button>
      </form>
    </div>
  );
}

export default AdminBrands;
