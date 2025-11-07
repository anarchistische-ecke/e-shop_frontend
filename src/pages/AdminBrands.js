import React, { useState, useEffect } from 'react';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../api';

function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newBrand, setNewBrand] = useState({ name: '', slug: '', description: '' });

  useEffect(() => {
    getBrands()
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch brands:', err));
  }, []);

  const handleEditChange = (index, field, value) => {
    setBrands((prev) =>
      prev.map((brand, i) => (i === index ? { ...brand, [field]: value } : brand))
    );
  };

  const handleSave = async (index) => {
    try {
      const brand = brands[index];
      await updateBrand(brand.id, {
        name: brand.name,
        slug: brand.slug,
        description: brand.description
      });
      const updatedList = await getBrands();
      setBrands(Array.isArray(updatedList) ? updatedList : []);
    } catch (err) {
      console.error('Failed to update brand:', err);
    } finally {
      setEditingIndex(null);
    }
  };

  const handleDelete = async (index) => {
    try {
      const brand = brands[index];
      await deleteBrand(brand.id);
      setBrands((prev) => prev.filter((_, i) => i !== index));
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Бренды</h1>
      <table className="w-full text-sm border border-gray-200">
        <thead className="bg-secondary">
          <tr>
            <th className="p-2 border-b">Название</th>
            <th className="p-2 border-b">Slug</th>
            <th className="p-2 border-b">Описание</th>
            <th className="p-2 border-b">Действия</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((brand, index) => (
            <tr key={brand.id || index} className="border-b">
              {editingIndex === index ? (
                <>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={brand.name} 
                      onChange={(e) => handleEditChange(index, 'name', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={brand.slug} 
                      onChange={(e) => handleEditChange(index, 'slug', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={brand.description || ''} 
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
                  <td className="p-2">{brand.name}</td>
                  <td className="p-2">{brand.slug}</td>
                  <td className="p-2">{brand.description ? brand.description.substring(0, 40) + '…' : ''}</td>
                  <td className="p-2">
                    <button onClick={() => setEditingIndex(index)} className="text-primary mr-2">
                      Редактировать
                    </button>
                    <button onClick={() => handleDelete(index)} className="text-red-600">
                      Удалить
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold">Добавить бренд</h2>
      <form onSubmit={handleAddNew} className="space-y-2 max-w-lg">
        <input 
          type="text" 
          placeholder="Название бренда" 
          value={newBrand.name} 
          onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })} 
          className="w-full p-2 border border-gray-300 rounded"
          required 
        />
        <input 
          type="text" 
          placeholder="Slug (англ. буквы)" 
          value={newBrand.slug} 
          onChange={(e) => setNewBrand({ ...newBrand, slug: e.target.value })} 
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
