import React from 'react';
import CmsManagedPage from '../components/cms/CmsManagedPage';
import Seo from '../components/Seo';

function DeliveryInfoFallbackPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Seo
        title="Доставка"
        description="Как менеджер согласует варианты доставки, сроки и итоговую стоимость после оформления заказа."
        canonicalPath="/info/delivery"
      />
      <p className="text-xs uppercase tracking-[0.3em] text-muted">Сервис</p>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4">Доставку согласует менеджер</h1>
      <p className="text-muted mb-6">
        При оформлении заказа вы оплачиваете только товары. После оплаты менеджер свяжется с вами, уточнит адрес и предложит доступные варианты доставки с финальной стоимостью.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Стоимость отдельно</h2>
          <p className="text-sm text-muted">
            Доставка не входит в онлайн-платёж. Менеджер рассчитает стоимость по адресу, габаритам заказа и доступным службам доставки.
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Варианты получения</h2>
          <p className="text-sm text-muted">
            Возможные варианты зависят от города и служб доставки. Менеджер подберёт удобный способ и согласует детали до отправки.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Сроки и условия</h2>
        <ul className="list-disc list-inside text-sm text-muted space-y-1">
          <li>Срок доставки зависит от региона, выбранной службы и способа получения.</li>
          <li>Наш менеджер свяжется с вами в ближайшее время после оплаты заказа.</li>
          <li>Если товар пришёл с дефектом, фиксируйте акт с курьером и напишите нам — заменим или вернём деньги.</li>
          <li>Статус заказа всегда виден в личном кабинете и в письмах на e‑mail.</li>
        </ul>
      </div>
    </div>
  );
}

function DeliveryInfoPage() {
  return <CmsManagedPage slug="delivery" fallback={<DeliveryInfoFallbackPage />} />;
}

export default DeliveryInfoPage;
