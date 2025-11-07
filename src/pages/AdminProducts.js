import React, { useState, useEffect } from 'react';
import {
  getProducts,
  getCategories,
  createProduct,
  addProductVariant,
  updateProduct,
  deleteProduct,
} from '../api';

/**
 * AdminProducts renders a management interface for products. It retrieves the product list and category metadata from the backend API.
 * New products are persisted via the API by first creating the product and then adding a variant for price/stock.
 * Editing and deletion are now persisted via the API as update/delete endpoints have been implemented.
 */
function AdminProducts() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    oldPrice: '',
    category: '',
    rating: 5,
    description: '',
  });

  // Load initial data
  useEffect(() => {
    getProducts()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch products:', err));
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  // Generate a URL-friendly slug from a product name
  const slugify = (str) => {
    return str
      .toString()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
  };

  const handleEditChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async (index) => {
    try {
      const product = items[index];
      // Persist the edited product via API
      await updateProduct(product.id, {
        name: product.name,
        description: product.description,
        slug: product.slug,
        category: product.category,
      });
      // Refresh the product list to reflect updates
      const updatedList = await getProducts();
      setItems(Array.isArray(updatedList) ? updatedList : []);
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

  const handleAddNew = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    try {
      // Generate a slug for the new product
      const slug = slugify(newItem.name);
      // Create the product via API (excluding price)
      const createdProduct = await createProduct({
        name: newItem.name,
        description: newItem.description,
        slug,
      });
      // Add a default variant with price and stock
      const priceAmount = Math.round(Number(newItem.price) * 100);
      await addProductVariant(createdProduct.id, {
        sku: `${slug}-default`,
        name: newItem.name,
        amount: priceAmount,
        currency: 'RUB',
        stock: 100,
      });
      // Reload the product list
      const updated = await getProducts();
      setItems(Array.isArray(updated) ? updated : []);
      // Reset the new product form
      setNewItem({
        name: '',
        price: '',
        oldPrice: '',
        category: categories[0]?.slug || '',
        rating: 5,
        description: '',
      });
    } catch (err) {
      console.error('Failed to create product:', err);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Управление товарами</h1>
      <table className="w-full text-left border border-gray-200 mb-4 text-sm">
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
            <tr key={item.id || index} className="border-b">
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
                      type="number"
                      value={item.price || ''}
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
                      value={item.category || ''}
                      onChange={(e) => handleEditChange(index, 'category', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    >
                      {categories.map((c) => (
                        <option key={c.slug || c.id} value={c.slug || c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.description || ''}
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
                  <td className="p-2">
                    {typeof item.price === 'object'
                      ? (item.price.amount / 100).toLocaleString('ru-RU')
                      : (item.price || 0).toLocaleString('ru-RU')}
                  </td>
                  <td className="p-2">
                    {item.oldPrice
                      ? typeof item.oldPrice === 'object'
                        ? (item.oldPrice.amount / 100).toLocaleString('ru-RU')
                        : item.oldPrice.toLocaleString('ru-RU')
                      : '—'}
                  </td>
                  <td className="p-2">
                    {categories.find((c) => c.slug === item.category || c.id === item.category)?.name || item.category || '—'}
                  </td>
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
        <div>
          <select
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
          >
            {categories.map((c) => (
              <option key={c.slug || c.id} value={c.slug || c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <textarea
            placeholder="Описание"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <button type="submit" className="button">
          Добавить
        </button>
      </form>
    </div>
  );
}

export default AdminProducts;
