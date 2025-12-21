import React from 'react';
import { getAdminActivityLogs } from '../api';

function AdminSecurity() {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [lastUpdated, setLastUpdated] = React.useState(null);
  const [twoFA, setTwoFA] = React.useState(false);
  const [sessionTimeout, setSessionTimeout] = React.useState(30);
  const [lastBackup, setLastBackup] = React.useState(null);

  const normalizeLogs = React.useCallback((items = []) => {
    return (items || []).map((item, idx) => ({
      id: item.id ?? item.logId ?? idx,
      user: item.user ?? item.username ?? item.actor ?? item.admin ?? '—',
      action: item.action ?? item.event ?? item.description ?? '—',
      date: item.date ?? item.timestamp ?? item.createdAt ?? item.time ?? item.loggedAt ?? '',
    }));
  }, []);

  const formatDate = React.useCallback((value) => {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('ru-RU');
  }, []);

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminActivityLogs();
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.content)
            ? data.content
            : [];
      setLogs(normalizeLogs(items));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load activity logs', err);
      setError(err.message || 'Не удалось загрузить журнал');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [normalizeLogs]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleBackup = () => {
    // In a real app trigger a server backup here
    const ts = new Date().toISOString();
    setLastBackup(ts);
    alert('Резервная копия создана');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Безопасность</h1>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Журнал активности</h2>
          <div className="flex items-center gap-3 text-xs text-muted">
            {lastUpdated && <span>Обновлено {formatDate(lastUpdated)}</span>}
            <button
              className="button-gray text-sm px-3 py-1"
              onClick={fetchLogs}
              disabled={loading}
            >
              {loading ? 'Обновление...' : 'Обновить'}
            </button>
          </div>
        </div>
        <table className="w-full text-sm border border-gray-200 table-fixed">
          <thead className="bg-secondary">
            <tr>
              <th className="p-2 border-b text-left w-1/4">Пользователь</th>
              <th className="p-2 border-b text-left w-1/2">Действие</th>
              <th className="p-2 border-b text-left w-1/4">Дата</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="p-3 text-center text-muted" colSpan={3}>
                  Загрузка журнала...
                </td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td className="p-3 text-center text-red-600 text-sm" colSpan={3}>
                  Не удалось загрузить журнал: {error}
                </td>
              </tr>
            )}
            {!loading && !error && logs.length === 0 && (
              <tr>
                <td className="p-3 text-center text-muted" colSpan={3}>
                  Записей пока нет
                </td>
              </tr>
            )}
            {!loading && !error && logs.map((log) => (
              <tr key={log.id} className="border-b">
                <td className="p-2 align-top truncate" title={log.user}>{log.user}</td>
                <td className="p-2 align-top truncate" title={log.action}>{log.action}</td>
                <td className="p-2 align-top whitespace-nowrap">{formatDate(log.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Настройки безопасности</h2>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={twoFA} onChange={(e) => setTwoFA(e.target.checked)} />
          <span>Двухфакторная аутентификация</span>
        </label>
        <div className="mt-3">
          <label className="block text-sm mb-1">Авто‑выход (минут)</label>
          <input
            type="number"
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
            className="p-2 border border-gray-300 rounded w-32"
          />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Резервное копирование</h2>
        <button className="button" onClick={handleBackup}>Создать резервную копию</button>
        <p className="text-xs text-muted mt-1">
          {lastBackup ? `Последняя копия: ${lastBackup}` : 'Копии ещё не создавались'}
        </p>
      </div>
    </div>
  );
}

export default AdminSecurity;
