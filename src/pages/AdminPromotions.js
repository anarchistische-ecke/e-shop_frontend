import React from 'react';

const DIRECTUS_BASE = (process.env.REACT_APP_DIRECTUS_URL || 'http://localhost:8055').replace(/\/$/, '');
const STOREFRONT_OPS_URL = `${DIRECTUS_BASE}/admin/storefront-ops`;

function AdminPromotions() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-muted">Акции и промокоды</p>
        <h1 className="mt-2 text-2xl font-semibold">Управление в Directus</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-700">
          Скидки, промокоды и распродажи редактируются только в Directus Storefront Ops.
          Суммы заказа пересчитываются на сервере, а ручные скидки для менеджерских заказов отключены.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="button" href={STOREFRONT_OPS_URL} target="_blank" rel="noreferrer">
            Открыть Storefront Ops
          </a>
          <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-2 text-xs text-gray-600">
            DSC-01: 50 000 ₽ / 65 000 ₽ / 100 000 ₽
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdminPromotions;
