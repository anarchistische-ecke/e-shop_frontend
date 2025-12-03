import React from 'react';

/**
 * AdminSecurity will provide tools for reviewing activity logs,
 * managing backups, enforcing password policies and enabling 2FA.
 * This placeholder outlines these capabilities.
 */
function AdminSecurity() {
  const [logs, setLogs] = React.useState([
    { id: 1, user: 'admin', action: 'Вошёл в систему', date: '2025-09-01 09:00' },
    { id: 2, user: 'admin', action: 'Изменил настройки магазина', date: '2025-09-01 09:30' },
  ]);
  const [twoFA, setTwoFA] = React.useState(false);
  const [sessionTimeout, setSessionTimeout] = React.useState(30);
  const [lastBackup, setLastBackup] = React.useState(null);

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
        <h2 className="text-xl font-semibold mb-2">Журнал активности</h2>
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-secondary">
            <tr>
              <th className="p-2 border-b">Пользователь</th>
              <th className="p-2 border-b">Действие</th>
              <th className="p-2 border-b">Дата</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b">
                <td className="p-2">{log.user}</td>
                <td className="p-2">{log.action}</td>
                <td className="p-2">{log.date}</td>
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
