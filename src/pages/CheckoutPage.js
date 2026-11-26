import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import NotificationBanner from '../components/NotificationBanner';
import Seo from '../components/Seo';
import CheckoutEmptyState from '../features/checkout/CheckoutEmptyState';
import CheckoutFlow from '../features/checkout/CheckoutFlow';
import CheckoutPageHeader from '../features/checkout/CheckoutPageHeader';
import { useCheckoutState } from '../features/checkout/useCheckoutState';

function CheckoutPage() {
  const statusRef = useRef(null);
  const checkout = useCheckoutState();

  useEffect(() => {
    if (!checkout.topNotification || checkout.isSubmitting || !statusRef.current) {
      return;
    }
    statusRef.current.focus();
  }, [checkout.isSubmitting, checkout.topNotification]);

  if (checkout.isManager) {
    return (
      <>
        <Seo
          title="Оформление заказа"
          description="Раздел оформления заказа недоступен для менеджерского режима."
          canonicalPath="/checkout"
          robots="noindex,nofollow"
        />
        <Navigate to="/cart" replace />
      </>
    );
  }

  if (!checkout.items.length) {
    return (
      <>
        <Seo
          title="Оформление заказа"
          description="Корзина пуста. Добавьте товары, чтобы перейти к оформлению."
          canonicalPath="/checkout"
          robots="noindex,nofollow"
        />
        <CheckoutEmptyState />
      </>
    );
  }

  const handleDisabledNavigation = (event) => {
    if (checkout.isSubmitting) {
      event.preventDefault();
    }
  };

  return (
    <div className="checkout-page pb-28 pt-3 sm:pt-6 lg:pb-14">
      <Seo
        title="Оформление заказа"
        description="Быстрое оформление заказа с контактами, адресом, оплатой товаров и обновлениями по заказу."
        canonicalPath="/checkout"
        robots="noindex,nofollow"
      />
      <div className="page-shell max-w-[1170px]">
        <CheckoutPageHeader
          isSubmitting={checkout.isSubmitting}
          onDisabledNavigation={handleDisabledNavigation}
        />

        {checkout.topNotification ? (
          <NotificationBanner
            ref={statusRef}
            notification={checkout.topNotification}
            tabIndex={-1}
            className="mb-5"
            onDismiss={!checkout.isSubmitting ? checkout.clearStatus : undefined}
          />
        ) : null}

        <CheckoutFlow checkout={checkout} />
      </div>
    </div>
  );
}

export default CheckoutPage;
