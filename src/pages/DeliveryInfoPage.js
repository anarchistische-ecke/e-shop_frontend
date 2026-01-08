import React from 'react';

function DeliveryInfoPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">Сервис</p>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4">Бесплатная доставка при оформлении заказа от 5000 ₽</h1>
      <p className="text-muted mb-6">
        Доставляем заказы по России курьером и в пункты выдачи. Условия рассчитываются автоматически при оформлении.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Бесплатно от 5000 ₽</h2>
          <p className="text-sm text-muted">
            Если сумма корзины от 5000 ₽, доставка в большинство городов бесплатна. Для удалённых регионов действует фиксированная доплата, мы покажем её перед оплатой.
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Пункты выдачи</h2>
          <p className="text-sm text-muted">
            Выбирайте удобный ПВЗ на карте. Хранение — 5–7 дней, продление возможно по запросу. Осмотрите заказ перед выкупом, обмен/возврат — по закону о защите прав потребителей.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Сроки и условия</h2>
        <ul className="list-disc list-inside text-sm text-muted space-y-1">
          <li>Срок доставки зависит от региона и выбранного оператора (обычно 2–7 дней).</li>
          <li>Курьер свяжется заранее, возможен перенос даты и времени.</li>
          <li>Если товар пришёл с дефектом, фиксируйте акт с курьером и напишите нам — заменим или вернём деньги.</li>
          <li>Статус заказа всегда виден в личном кабинете и в письмах на e‑mail.</li>
        </ul>
      </div>
    </div>
  );
}

export default DeliveryInfoPage;
