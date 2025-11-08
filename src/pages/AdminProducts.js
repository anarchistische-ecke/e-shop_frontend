import React, { useState, useEffect } from 'react';
import {
  getProducts,
  getCategories,
  getBrands,
  createProduct,
  addProductVariant,
  updateProduct,
  deleteProduct
} from '../api';

function AdminProducts() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    oldPrice: '',
    category: '',
    brand: '',
    rating: 5,
    description: ''
  });

  useEffect(() => {
    // Fetch initial data: products, categories, brands
    getProducts().then(data => setItems(Array.isArray(data) ? data : []))
                .catch(err => console.error('Failed to fetch products:', err));
    getCategories().then(data => {
      const cats = Array.isArray(data) ? data : [];
      setCategories(cats);
      if (cats.length > 0) {
        setNewItem(prev => ({ ...prev, category: cats[0].slug || cats[0].id }));
      }
    }).catch(err => console.error('Failed to fetch categories:', err));
    getBrands().then(data => {
      const brs = Array.isArray(data) ? data : [];
      setBrands(brs);
      if (brs.length > 0) {
        setNewItem(prev => ({ ...prev, brand: brs[0].slug || brs[0].id }));
      }
    }).catch(err => console.error('Failed to fetch brands:', err));
  }, []);

  const slugify = str => {
    return str.toString().normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim().toLowerCase()
      .replace(/\s+/g, '-');
  };

  const handleEditChange = (index, field, value) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSave = async index => {
    try {
      const product = items[index];
      // Persist changes via API.  Send the full set of required fields
      await updateProduct(product.id, {
        name: product.name,
        description: product.description,
        slug: product.slug,
        category: product.category,
        brand: product.brand
      });
      // Refresh product list
      const updatedList = await getProducts();
      setItems(Array.isArray(updatedList) ? updatedList : []);
    } catch (err) {
      console.error('Failed to update product:', err);
    } finally {
      setEditingIndex(null);
    }
  };

  const handleDelete = async index => {
    try {
      const product = items[index];
      await deleteProduct(product.id);
      setItems(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleAddNew = async e => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    try {
      const slug = slugify(newItem.name);
      // Create product including optional category and brand.  Backend will ignore
      // category and brand if not provided
      const created = await createProduct({
        name: newItem.name,
        description: newItem.description,
        slug: slug,
        category: newItem.category,
        brand: newItem.brand
      });
      // Add default variant with price and stock
      const priceAmount = Math.round(Number(newItem.price) * 100);
      await addProductVariant(created.id, {
        sku: `${slug}-default`,
        name: newItem.name,
        amount: priceAmount,
        currency: 'RUB',
        stock: 100
      });
      // Reload products list
      const updated = await getProducts();
      setItems(Array.isArray(updated) ? updated : []);
      // Reset the new product form
      setNewItem({
        name: '',
        price: '',
        oldPrice: '',
        category: categories[0]?.slug || '',
        brand: brands[0]?.slug || '',
        rating: 5,
        description: ''
      });
    } catch (err) {
      console.error('Failed to create product:', err);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Управление товарами</h1>
      <table className="w-full text-left border border-gray-200 text-sm">
        <thead className="bg-secondary">
          <tr>
            <th className="p-2 border-b">Название</th>
            <th className="p-2 border-b">Цена</th>
            <th className="p-2 border-b">Старая цена</th>
            <th className="p-2 border-b">Категория</th>
            <th className="p-2 border-b">Бренд</th>
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
                      onChange={e => handleEditChange(index, 'name', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.price || ''}
                      onChange={e => handleEditChange(index, 'price', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.oldPrice || ''}
                      onChange={e => handleEditChange(index, 'oldPrice', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={item.category || ''}
                      onChange={e => handleEditChange(index, 'category', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    >
                      {categories.map(cat => (
                        <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={item.brand || ''}
                      onChange={e => handleEditChange(index, 'brand', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    >
                      {brands.map(b => (
                        <option key={b.slug || b.id} value={b.slug || b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={e => handleEditChange(index, 'description', e.target.value)}
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
                  <td className="p-2">{item.price ? Number(item.price).toLocaleString('ru-RU') : ''}</td>
                  <td className="p-2">{item.oldPrice ? Number(item.oldPrice).toLocaleString('ru-RU') : ''}</td>
                  <td className="p-2">
                    {(() => {
                      const cat = categories.find(c => c.slug === item.category || c.id === item.category);
                      return cat ? cat.name : item.category;
                    })()}
                  </td>
                  <td className="p-2">
                    {(() => {
                      const br = brands.find(b => b.slug === item.brand || b.id === item.brand);
                      return br ? br.name : item.brand;
                    })()}
                  </td>
                  <td className="p-2">{item.description ? item.description.substring(0, 40) + '…' : ''}</td>
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
      {/* New product form */}
      <h2 className="text-xl font-semibold">Добавить новый товар</h2>
      <form onSubmit={handleAddNew} className="space-y-2 max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <input
            type="text"
            placeholder="Название"
            value={newItem.name}
            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded mb-2 sm:mb-0"
            required
          />
          <input
            type="number"
            placeholder="Цена"
            value={newItem.price}
            onChange={e => setNewItem({ ...newItem, price: e.target.value })}
            className="w-32 p-2 border border-gray-300 rounded mb-2 sm:mb-0"
            required
          />
          <input
            type="number"
            placeholder="Старая цена (необязательно)"
            value={newItem.oldPrice}
            onChange={e => setNewItem({ ...newItem, oldPrice: e.target.value })}
            className="w-36 p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <select
            value={newItem.category}
            onChange={e => setNewItem({ ...newItem, category: e.target.value })}
            className="p-2 border border-gray-300 rounded mb-2 sm:mb-0"
          >
            {categories.map(cat => (
              <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={newItem.brand}
            onChange={e => setNewItem({ ...newItem, brand: e.target.value })}
            className="p-2 border border-gray-300 rounded mb-2 sm:mb-0"
          >
            {brands.map(b => (
              <option key={b.slug || b.id} value={b.slug || b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Описание (необязательно)"
            value={newItem.description}
            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
        </div>
        <button type="submit" className="button">Добавить товар</button>
      </form>
    </div>
  );
}

export default AdminProducts;