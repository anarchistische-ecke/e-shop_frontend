import React from 'react';

function PaymentInfoPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-semibold mb-4">Удобная оплата</h1>
      <p className="text-muted mb-6">
        Мы поддерживаем безопасные способы оплаты и сразу показываем итоговую стоимость заказа.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Банковская карта</h2>
          <p className="text-sm text-muted">
            Принимаем карты Mir, Visa и MasterCard. Платёж проходит через защищённый шлюз, данные карты не сохраняются на нашей стороне.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">СБП и рассрочка</h2>
          <p className="text-sm text-muted">
            Оплачивайте через СБП без комиссии или выбирайте оплату частями у партнёров‑банков. Условия рассрочки показываем перед подтверждением.
          </p>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Оплата при получении</h2>
        <p className="text-sm text-muted">
          В пунктах выдачи и у курьеров доступна оплата картой или наличными, если поддерживается оператором доставки. На некоторых локациях доступна только предоплата — это будет указано при оформлении.
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-1">
          <li>Чеки отправляем на e‑mail и в личный кабинет.</li>
          <li>При отмене заказа возврат оформляется тем же способом оплаты.</li>
          <li>Вопросы по оплате: support@example.com или +7 (999) 123‑45‑67.</li>
        </ul>
      </div>
    </div>
  );
}

export default PaymentInfoPage;
