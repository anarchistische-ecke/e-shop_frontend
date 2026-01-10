import React from 'react';

function LegalInfoPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">Документы</p>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4">
        Пользовательское соглашение и публичная оферта
      </h1>
      <p className="text-sm text-muted mb-6">
        Настоящий документ регулирует использование сайта и порядок оформления заказов. Размещая
        заказ на сайте, пользователь подтверждает согласие с условиями оферты.
      </p>

      <div className="space-y-4">
        <section className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold">1. Общие положения</h2>
          <p className="text-sm text-muted">
            Продавец — индивидуальный предприниматель ИП Касьянова И.Л. (ИНН 081407505907,
            ОГРНИП 325080000035116). Сайт является витриной товаров и сервисом оформления заказов.
          </p>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold">2. Предмет оферты</h2>
          <p className="text-sm text-muted">
            Продавец обязуется передать в собственность покупателю товары, представленные в каталоге,
            а покупатель обязуется оплатить и принять товар на условиях настоящей оферты.
          </p>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold">3. Оформление заказа</h2>
          <p className="text-sm text-muted">
            Заказ оформляется на сайте через корзину. После подтверждения заказа покупателю
            направляется уведомление с деталями заказа на e‑mail или в личный кабинет.
          </p>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold">4. Цена и оплата</h2>
          <p className="text-sm text-muted">
            Все цены указаны в рублях РФ и действуют на момент оформления заказа. Доступные способы
            оплаты описаны на странице «Способы оплаты». Продавец вправе отменить заказ при
            невозможности подтверждения оплаты.
          </p>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold">5. Доставка</h2>
          <p className="text-sm text-muted">
            Условия доставки и сроки зависят от региона и выбранного способа. Актуальные правила
            указаны на странице «Доставка и самовывоз».
          </p>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold">6. Возврат и обмен</h2>
          <p className="text-sm text-muted">
            Возврат товара надлежащего качества возможен в течение 14 дней с даты получения при
            сохранении товарного вида, потребительских свойств и документов о покупке. Перечень
            товаров, не подлежащих возврату, определяется законодательством РФ. Для оформления
            возврата свяжитесь с поддержкой.
          </p>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold">7. Ответственность сторон</h2>
          <p className="text-sm text-muted">
            Стороны несут ответственность за неисполнение обязательств в соответствии с
            законодательством РФ. Продавец не отвечает за задержки, вызванные обстоятельствами
            непреодолимой силы.
          </p>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold">8. Персональные данные</h2>
          <p className="text-sm text-muted">
            Оформляя заказ, пользователь соглашается на обработку персональных данных в объёме,
            необходимом для исполнения договора и доставки заказа. Обработка осуществляется в
            соответствии с ФЗ‑152 «О персональных данных».
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-2 mt-6">
        <h2 className="text-lg font-semibold">Реквизиты продавца</h2>
        <p className="text-sm text-muted">ИП Касьянова И.Л.</p>
        <p className="text-sm text-muted">ИНН 081407505907</p>
        <p className="text-sm text-muted">ОГРНИП 325080000035116</p>
        <p className="text-sm text-muted">Адрес: (укажите юридический/почтовый адрес)</p>
        <p className="text-sm text-muted">Телефон: +7 (999) 123‑45‑67</p>
        <p className="text-sm text-muted">E‑mail: hello@cozyhome.ru</p>
      </section>
    </div>
  );
}

export default LegalInfoPage;
