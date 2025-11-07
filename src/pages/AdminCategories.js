import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' });

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  const handleEditChange = (index, field, value) => {
    setCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, [field]: value } : cat))
    );
  };

  const handleSave = async (index) => {
    try {
      const cat = categories[index];
      await updateCategory(cat.id, {
        name: cat.name,
        slug: cat.slug,
        description: cat.description
      });
      const updatedList = await getCategories();
      setCategories(Array.isArray(updatedList) ? updatedList : []);
    } catch (err) {
      console.error('Failed to update category:', err);
    } finally {
      setEditingIndex(null);
    }
  };

  const handleDelete = async (index) => {
    try {
      const cat = categories[index];
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((_, i) => i !== index));
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Категории</h1>
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
          {categories.map((cat, index) => (
            <tr key={cat.id || index} className="border-b">
              {editingIndex === index ? (
                <>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={cat.name} 
                      onChange={(e) => handleEditChange(index, 'name', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={cat.slug} 
                      onChange={(e) => handleEditChange(index, 'slug', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={cat.description || ''} 
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
                  <td className="p-2">{cat.name}</td>
                  <td className="p-2">{cat.slug}</td>
                  <td className="p-2">{cat.description ? cat.description.substring(0, 40) + '…' : ''}</td>
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

      <h2 className="text-xl font-semibold">Добавить категорию</h2>
      <form onSubmit={handleAddNew} className="space-y-2 max-w-lg">
        <input 
          type="text" 
          placeholder="Название" 
          value={newCategory.name} 
          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} 
          className="w-full p-2 border border-gray-300 rounded"
          required 
        />
        <input 
          type="text" 
          placeholder="Slug (англ. буквы)" 
          value={newCategory.slug} 
          onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })} 
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
