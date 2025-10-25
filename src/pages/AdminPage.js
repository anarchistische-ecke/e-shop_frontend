import React, { useState } from 'react';
import { products as initialProducts } from '../data/products';
import { categories } from '../data/categories';

/**
 * AdminPage provides a simple interface for managing products.  It allows
 * the shop manager to edit existing items (name, price, old price,
 * category and description), delete items, and add new products.  This
 * functionality is purely front‑end: changes are kept in local state
 * and do not persist across page reloads.  When integrating with a
 * backend you can replace the state updates with API calls.
 */
function AdminPage() {
  const [items, setItems] = useState(() => initialProducts.map((p) => ({ ...p })));
  const [editingIndex, setEditingIndex] = useState(null);
  const [newItem, setNewItem] = useState({
    id: '',
    name: '',
    price: '',
    oldPrice: '',
    category: categories[0].slug,
    rating: 5,
    description: '',
  });

  // Handle change for editing existing products
  const handleEditChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = (index) => {
    // Validate and exit edit mode
    setEditingIndex(null);
  };

  const handleDelete = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddNew = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    const id = 'n' + Date.now();
    setItems((prev) => [...prev, { ...newItem, id, price: Number(newItem.price), oldPrice: newItem.oldPrice ? Number(newItem.oldPrice) : undefined }]);
    setNewItem({ id: '', name: '', price: '', oldPrice: '', category: categories[0].slug, rating: 5, description: '' });
  };

  return (
    <div className="admin-page container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Панель администратора</h1>
      <table className="w-full text-left border border-gray-200 mb-8 text-sm">
        <thead className="bg-secondary">
          <tr>
            <th className="p-2 border-b">Название</th>
            <th className="p-2 border-b">Цена</th>
            <th className="p-2 border-b">Старая цена</th>
            <th className="p-2 border-b">Категория</th>
            <th className="p-2 border-b">Описание</th>
            <th className="p-2 border-b">Действия</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id} className="border-b">
              {editingIndex === index ? (
                <>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleEditChange(index, 'name', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleEditChange(index, 'price', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.oldPrice || ''}
                      onChange={(e) => handleEditChange(index, 'oldPrice', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={item.category}
                      onChange={(e) => handleEditChange(index, 'category', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    >
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleEditChange(index, 'description', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2 space-x-2">
                    <button className="button" onClick={() => handleSave(index)}>
                      Сохранить
                    </button>
                    <button className="button-gray" onClick={() => setEditingIndex(null)}>
                      Отмена
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">{item.price.toLocaleString('ru-RU')}</td>
                  <td className="p-2">{item.oldPrice ? item.oldPrice.toLocaleString('ru-RU') : '—'}</td>
                  <td className="p-2">{categories.find((c) => c.slug === item.category)?.name || item.category}</td>
                  <td className="p-2">{item.description || '—'}</td>
                  <td className="p-2 space-x-2">
                    <button className="button" onClick={() => setEditingIndex(index)}>
                      Редактировать
                    </button>
                    <button className="button-gray" onClick={() => handleDelete(index)}>
                      Удалить
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="text-xl font-semibold mb-4">Добавить новый продукт</h2>
      <form onSubmit={handleAddNew} className="space-y-4 max-w-xl">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Название"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <input
            type="number"
            placeholder="Цена"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <input
            type="number"
            placeholder="Старая цена"
            value={newItem.oldPrice}
            onChange={(e) => setNewItem({ ...newItem, oldPrice: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Описание"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
        </div>
        {/* Placeholder for image upload */}
        <div>
          <label className="block mb-1">Изображение продукта</label>
          <input type="file" disabled className="p-2 border border-gray-300 rounded w-full" />
        </div>
        <button type="submit" className="button">
          Добавить
        </button>
      </form>
    </div>
  );
}

export default AdminPage;