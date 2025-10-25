import React from 'react';

/**
 * AdminContent manages static pages and blog posts.  This placeholder
 * outlines the intended capabilities including page editing, blog
 * management, menu configuration and banner updates.
 */
function AdminContent() {
  const initialPages = [
    { id: 'p01', title: 'О нас', slug: 'about', content: 'Содержание страницы О нас...' },
    { id: 'p02', title: 'Контакты', slug: 'contact', content: 'Содержание страницы Контакты...' },
  ];
  const [pages, setPages] = React.useState(initialPages);
  const [editingId, setEditingId] = React.useState(null);
  const [newPage, setNewPage] = React.useState({ title: '', slug: '', content: '' });

  const handleChange = (id, field, value) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleDelete = (id) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newPage.title || !newPage.slug) return;
    const id = 'p' + Date.now();
    setPages((prev) => [...prev, { ...newPage, id }]);
    setNewPage({ title: '', slug: '', content: '' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Статические страницы</h1>
      <table className="w-full text-sm border border-gray-200">
        <thead className="bg-secondary">
          <tr>
            <th className="p-2 border-b">Название</th>
            <th className="p-2 border-b">Slug</th>
            <th className="p-2 border-b">Контент</th>
            <th className="p-2 border-b">Действия</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">
                {editingId === p.id ? (
                  <input
                    type="text"
                    value={p.title}
                    onChange={(e) => handleChange(p.id, 'title', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                ) : (
                  p.title
                )}
              </td>
              <td className="p-2">
                {editingId === p.id ? (
                  <input
                    type="text"
                    value={p.slug}
                    onChange={(e) => handleChange(p.id, 'slug', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                ) : (
                  p.slug
                )}
              </td>
              <td className="p-2">
                {editingId === p.id ? (
                  <textarea
                    value={p.content}
                    onChange={(e) => handleChange(p.id, 'content', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded"
                    rows={2}
                  />
                ) : (
                  <span className="truncate block max-w-xs" title={p.content}>{p.content}</span>
                )}
              </td>
              <td className="p-2 space-x-2">
                {editingId === p.id ? (
                  <>
                    <button className="button" onClick={() => setEditingId(null)}>Сохранить</button>
                    <button className="button-gray" onClick={() => setEditingId(null)}>Отмена</button>
                  </>
                ) : (
                  <>
                    <button className="button" onClick={() => setEditingId(p.id)}>Редактировать</button>
                    <button className="button-gray" onClick={() => handleDelete(p.id)}>Удалить</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="text-xl font-semibold">Добавить страницу</h2>
      <form onSubmit={handleAdd} className="space-y-4 max-w-xl">
        <input
          type="text"
          placeholder="Название"
          value={newPage.title}
          onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          placeholder="Slug (латиницей)"
          value={newPage.slug}
          onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <textarea
          placeholder="Контент"
          value={newPage.content}
          onChange={(e) => setNewPage({ ...newPage, content: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
          rows={3}
        />
        <button type="submit" className="button">Добавить</button>
      </form>
    </div>
  );
}

export default AdminContent;