import React from 'react';

function AdminContent() {
  const initialPages = React.useMemo(
    () => [
      { id: 'p02', title: 'Контакты', slug: 'contact', content: 'Содержание страницы Контакты...', published: true },
    ],
    []
  );
  const sanitizePages = React.useCallback(
    (list) => (Array.isArray(list) ? list.filter((page) => page?.slug !== 'about') : []),
    []
  );
  const [pages, setPages] = React.useState(() => {
    const saved = localStorage.getItem('adminPages');
    if (!saved) return initialPages;
    try {
      return sanitizePages(JSON.parse(saved));
    } catch (err) {
      return initialPages;
    }
  });
  const [editingId, setEditingId] = React.useState(null);
  const [newPage, setNewPage] = React.useState({ title: '', slug: '', content: '', published: true });
  const [banner, setBanner] = React.useState(() => localStorage.getItem('adminBanner') || '');
  const [menuLinks, setMenuLinks] = React.useState(() => {
    const saved = localStorage.getItem('adminMenuLinks');
    return saved ? JSON.parse(saved) : ['Каталог', 'Доставка', 'Контакты'];
  });

  React.useEffect(() => {
    localStorage.setItem('adminPages', JSON.stringify(pages));
  }, [pages]);
  React.useEffect(() => {
    localStorage.setItem('adminBanner', banner);
  }, [banner]);
  React.useEffect(() => {
    localStorage.setItem('adminMenuLinks', JSON.stringify(menuLinks));
  }, [menuLinks]);

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
    setNewPage({ title: '', slug: '', content: '', published: true });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Статические страницы и контент</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <h2 className="text-lg font-semibold">Страницы</h2>
          <div className="text-sm text-muted">Публикуйте и обновляйте текстовые страницы магазина</div>
        </div>
        <div className="md:hidden space-y-3">
          {pages.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm space-y-2">
              <div>
                <span className="text-xs text-muted block">Название</span>
                {editingId === p.id ? (
                  <input
                    type="text"
                    value={p.title}
                    onChange={(e) => handleChange(p.id, 'title', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                ) : (
                  <span className="font-semibold">{p.title}</span>
                )}
              </div>
              <div>
                <span className="text-xs text-muted block">Slug</span>
                {editingId === p.id ? (
                  <input
                    type="text"
                    value={p.slug}
                    onChange={(e) => handleChange(p.id, 'slug', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                ) : (
                  <span>{p.slug}</span>
                )}
              </div>
              <div>
                <span className="text-xs text-muted block">Контент</span>
                {editingId === p.id ? (
                  <textarea
                    value={p.content}
                    onChange={(e) => handleChange(p.id, 'content', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    rows={3}
                  />
                ) : (
                  <span>{p.content ? `${p.content.substring(0, 120)}…` : '—'}</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={p.published}
                    onChange={(e) => handleChange(p.id, 'published', e.target.checked)}
                  />
                  <span>{p.published ? 'Опубликовано' : 'Черновик'}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {editingId === p.id ? (
                    <>
                      <button className="button text-xs" onClick={() => setEditingId(null)}>Сохранить</button>
                      <button className="button-gray text-xs" onClick={() => setEditingId(null)}>Отмена</button>
                    </>
                  ) : (
                    <>
                      <button className="button text-xs" onClick={() => setEditingId(p.id)}>Редактировать</button>
                      <button className="button-gray text-xs" onClick={() => handleDelete(p.id)}>Удалить</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {pages.length === 0 && (
            <div className="text-sm text-muted text-center">Страницы не созданы</div>
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 align-top">
            <thead className="bg-secondary">
              <tr>
                <th className="p-2 border-b">Название</th>
                <th className="p-2 border-b">Slug</th>
                <th className="p-2 border-b">Контент</th>
                <th className="p-2 border-b">Статус</th>
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
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={p.published}
                      onChange={(e) => handleChange(p.id, 'published', e.target.checked)}
                    />
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
              {pages.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted">Страницы не созданы</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <h2 className="text-xl font-semibold mt-6 mb-2">Добавить страницу</h2>
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newPage.published}
              onChange={(e) => setNewPage({ ...newPage, published: e.target.checked })}
            />
            <span>Опубликовать сразу</span>
          </label>
          <button type="submit" className="button">Добавить</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Баннер на главной</h2>
          <textarea
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            rows={3}
            placeholder="Текст/ссылка для баннера"
          />
          <p className="text-xs text-muted mt-1">Сохранение происходит автоматически (локально).</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Меню сайта</h2>
          <div className="space-y-2">
            {menuLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={link}
                  onChange={(e) =>
                    setMenuLinks((prev) => prev.map((l, i) => (i === idx ? e.target.value : l)))
                  }
                  className="flex-1 p-2 border border-gray-300 rounded"
                />
                <button
                  className="button-gray text-xs"
                  onClick={() => setMenuLinks((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Удалить
                </button>
              </div>
            ))}
            <button
              className="button text-sm"
              onClick={() => setMenuLinks((prev) => [...prev, 'Новый пункт'])}
            >
              Добавить пункт
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminContent;
