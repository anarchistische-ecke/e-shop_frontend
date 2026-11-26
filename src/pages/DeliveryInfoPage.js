import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CmsManagedPage from '../components/cms/CmsManagedPage';
import { TruckIcon } from '../components/header/icons';
import { Button } from '../components/ui';
import Seo from '../components/Seo';
import { useCmsSiteSettings } from '../contexts/CmsContentContext';
import { DELIVERY_DISCLOSURE } from '../utils/delivery';

function DeliveryContact() {
  const { hash } = useLocation();
  const { siteSettings } = useCmsSiteSettings();
  const phone = String(siteSettings.supportPhone || '').replace(/[^\d+]/g, '');
  const email = siteSettings.supportEmail;

  useEffect(() => {
    if (hash === '#delivery-contact') {
      document.getElementById('delivery-contact')?.scrollIntoView({ block: 'start' });
    }
  }, [hash]);

  return (
    <div className="page-shell page-shell--narrow pb-10">
      <section id="delivery-contact" className="scroll-mt-36 rounded-xl border border-line bg-sky/55 p-5 md:p-7" aria-labelledby="delivery-contact-title">
        <TruckIcon className="mb-3 h-6 w-6 text-primary" />
        <h2 id="delivery-contact-title" className="text-2xl font-semibold">Уточнить доставку до оплаты</h2>
        <p className="mt-2 max-w-prose text-sm leading-6 text-muted">
          Сообщите менеджеру ваш город и какие товары вы выбрали. Он уточнит доступные способы, сроки и стоимость доставки.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {phone ? <Button as="a" href={`tel:${phone}`}>Позвонить</Button> : null}
          {email ? (
            <Button as="a" variant={phone ? 'secondary' : 'primary'} href={`mailto:${email}?subject=${encodeURIComponent('Уточнить доставку до оплаты')}`}>
              Написать на почту
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function DeliveryInfoFallbackPage() {
  return (
    <>
      <div className="page-shell page-shell--narrow page-section">
        <Seo
          title="Доставка"
          description="Как менеджер согласует варианты доставки, сроки и итоговую стоимость после оформления заказа."
          canonicalPath="/info/delivery"
        />
        <h1 className="mb-3 text-3xl font-semibold leading-tight sm:text-4xl">Доставку согласует менеджер</h1>
        <p className="mb-6 max-w-prose leading-7 text-muted">
          {DELIVERY_DISCLOSURE}
        </p>
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-lg font-semibold mb-2">Стоимость отдельно</h2>
            <p className="text-sm text-muted">
              Доставка не входит в онлайн-платёж. Менеджер рассчитает стоимость по адресу, габаритам заказа и доступным службам доставки.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-lg font-semibold mb-2">Варианты получения</h2>
            <p className="text-sm text-muted">
              Возможные варианты зависят от города и служб доставки. Менеджер подберёт удобный способ и согласует детали до отправки.
            </p>
          </div>
        </div>
        <div className="space-y-3 border-t border-line pt-5">
          <h2 className="text-lg font-semibold">Сроки и условия</h2>
          <ul className="list-disc list-inside text-sm text-muted space-y-1">
            <li>Срок доставки зависит от региона, выбранной службы и способа получения.</li>
            <li>Наш менеджер свяжется с вами в ближайшее время после оплаты заказа.</li>
            <li>Если товар пришёл с дефектом, фиксируйте акт с курьером и напишите нам — заменим или вернём деньги.</li>
            <li>Статус заказа всегда виден в личном кабинете и в письмах на электронную почту.</li>
          </ul>
        </div>
      </div>
      <DeliveryContact />
    </>
  );
}

function DeliveryInfoPage() {
  return (
    <CmsManagedPage
      slug="delivery"
      fallback={<DeliveryInfoFallbackPage />}
      afterManagedContent={<DeliveryContact />}
    />
  );
}

export default DeliveryInfoPage;
