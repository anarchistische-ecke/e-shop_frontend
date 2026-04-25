import React from 'react';
import CmsManagedPage from '../components/cms/CmsManagedPage';
import Seo from '../components/Seo';

function PaymentInfoFallbackPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Seo
        title="Способы оплаты"
        description="Безопасная полная предоплата картой и через СБП, онлайн-чеки 54-ФЗ и возвраты тем же способом."
        canonicalPath="/info/payment"
      />
      <p className="text-xs uppercase tracking-[0.3em] text-muted">Сервис</p>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4">Удобная оплата</h1>
      <p className="text-muted mb-6">
        На первом этапе заказ оплачивается полной предоплатой товаров через YooKassa. Доставку менеджер согласует отдельно после оформления.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Банковская карта</h2>
          <p className="text-sm text-muted">
            Принимаем карты Mir, Visa и MasterCard. Платёж проходит через защищённый шлюз, данные карты не сохраняются на нашей стороне.
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">СБП</h2>
          <p className="text-sm text-muted">
            Оплачивайте через Систему быстрых платежей в защищённой форме YooKassa. На сайте доступны только карта и СБП.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Доставка после оплаты</h2>
        <p className="text-sm text-muted">
          Финальную стоимость и варианты доставки согласует менеджер. После оплаты заказа он свяжется с вами, уточнит адрес и предложит доступные способы получения.
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-1">
          <li>Онлайн-чеки 54-ФЗ формирует YooKassa и отправляет на e‑mail.</li>
          <li>При отмене заказа возврат оформляется тем же способом оплаты.</li>
          <li>Вопросы по оплате: postel-yug@yandex.ru или +7 961 466‑88‑33.</li>
        </ul>
      </div>
    </div>
  );
}

function PaymentInfoPage() {
  return <CmsManagedPage slug="payment" fallback={<PaymentInfoFallbackPage />} />;
}

export default PaymentInfoPage;
