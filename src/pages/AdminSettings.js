import React from 'react';

/**
 * AdminSettings will allow configuring store information, payment
 * gateways, shipping zones, taxes and user roles.  This placeholder
 * hints at future settings forms and toggles.
 */
function AdminSettings() {
  const [settings, setSettings] = React.useState({
    storeName: 'Постельное Белье‑Юг',
    email: 'info@example.com',
    phone: '+7 (999) 123‑45‑67',
    address: 'Москва, ул. Пример, 1',
    currency: 'RUB',
    shippingRate: 300,
    taxRate: 20,
  });

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In real implementation send updated settings to the server
    alert('Настройки сохранены');
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-semibold">Настройки магазина</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Название магазина</label>
          <input
            type="text"
            value={settings.storeName}
            onChange={(e) => handleChange('storeName', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">E‑mail</label>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Телефон</label>
          <input
            type="text"
            value={settings.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Адрес</label>
          <input
            type="text"
            value={settings.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label className="block text-sm mb-1">Валюта</label>
            <select
              value={settings.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="RUB">RUB</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Стоимость доставки</label>
            <input
              type="number"
              value={settings.shippingRate}
              onChange={(e) => handleChange('shippingRate', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Налог (%)</label>
            <input
              type="number"
              value={settings.taxRate}
              onChange={(e) => handleChange('taxRate', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
        <button type="submit" className="button">
          Сохранить
        </button>
      </form>
    </div>
  );
}

export default AdminSettings;