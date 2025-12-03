import React from 'react';

/**
 * AdminSettings will allow configuring store information, payment
 * gateways, shipping zones, taxes and user roles.  This placeholder
 * hints at future settings forms and toggles.
 */
function AdminSettings() {
  const [settings, setSettings] = React.useState(() => {
    const storedBannerToggle = typeof window !== 'undefined' ? localStorage.getItem('adminBannerEnabled') : null;
    return {
      storeName: 'Постельное Белье‑Юг',
      email: 'info@example.com',
      phone: '+7 (999) 123‑45‑67',
      address: 'Москва, ул. Пример, 1',
      currency: 'RUB',
      shippingRate: 300,
      taxRate: 20,
      cod: true,
      sbp: true,
      card: true,
      showBanner: storedBannerToggle !== null ? storedBannerToggle === 'true' : true
    };
  });

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In real implementation send updated settings to the server
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminBannerEnabled', String(settings.showBanner));
    }
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
        <div className="border border-gray-200 rounded p-3 space-y-2">
          <p className="text-sm font-semibold">Способы оплаты</p>
          {[
            { key: 'card', label: 'Банковская карта' },
            { key: 'sbp', label: 'СБП' },
            { key: 'cod', label: 'Оплата при получении' },
          ].map((method) => (
            <label key={method.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings[method.key]}
                onChange={(e) => handleChange(method.key, e.target.checked)}
              />
              <span>{method.label}</span>
            </label>
          ))}
        </div>
        <div className="border border-gray-200 rounded p-3 space-y-2">
          <p className="text-sm font-semibold">Баннер на главной</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.showBanner}
              onChange={(e) => handleChange('showBanner', e.target.checked)}
            />
            <span>Показывать баннер (текст задаётся в «Контент»)</span>
          </label>
        </div>
        <button type="submit" className="button">
          Сохранить
        </button>
      </form>
    </div>
  );
}

export default AdminSettings;
