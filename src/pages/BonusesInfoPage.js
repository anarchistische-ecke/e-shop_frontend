import React from 'react';

function BonusesInfoPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-semibold mb-4">Бонусы за покупки</h1>
      <p className="text-muted mb-6">
        Лояльность простая: авторизуйтесь, копите баллы и оплачивайте ими до 20% стоимости следующего заказа.
      </p>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Как это работает</h2>
        <ul className="list-disc list-inside text-sm text-muted space-y-1">
          <li>1 бонус = 1 рубль. Начисляем после подтверждения доставки.</li>
          <li>Бонусы действуют 12 месяцев с момента начисления.</li>
          <li>Не суммируются с промокодами, если в условиях акции указано иначе.</li>
          <li>Баланс и история начислений доступны в личном кабинете.</li>
        </ul>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Дополнительные бонусы</h3>
          <p className="text-sm text-muted">
            Дарим за отзывы с фото, участие в опросах и рекомендации друзьям. Размер поощрения зависит от активности.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Возвраты</h3>
          <p className="text-sm text-muted">
            При возврате товара списанные бонусы возвращаются на счёт после обработки заявки.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BonusesInfoPage;
