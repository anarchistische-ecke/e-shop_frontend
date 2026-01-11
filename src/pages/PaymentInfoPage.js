import React from 'react';

function PaymentInfoPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">Сервис</p>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4">Удобная оплата</h1>
      <p className="text-muted mb-6">
        Мы поддерживаем безопасные способы оплаты и сразу показываем итоговую стоимость заказа.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Банковская карта</h2>
          <p className="text-sm text-muted">
            Принимаем карты Mir, Visa и MasterCard. Платёж проходит через защищённый шлюз, данные карты не сохраняются на нашей стороне.
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">СБП и рассрочка</h2>
          <p className="text-sm text-muted">
            Оплачивайте через СБП без комиссии или выбирайте оплату частями у партнёров‑банков. Условия рассрочки показываем перед подтверждением.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Оплата при получении</h2>
        <p className="text-sm text-muted">
          В пунктах выдачи и у курьеров доступна оплата картой или наличными, если поддерживается оператором доставки. На некоторых локациях доступна только предоплата — это будет указано при оформлении.
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-1">
          <li>Чеки отправляем на e‑mail и в личный кабинет.</li>
          <li>При отмене заказа возврат оформляется тем же способом оплаты.</li>
          <li>Вопросы по оплате: postel-yug@yandex.ru или +7 961 466‑88‑33.</li>
        </ul>
      </div>
    </div>
  );
}

export default PaymentInfoPage;
