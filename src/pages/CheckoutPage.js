import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import NotificationBanner from '../components/NotificationBanner';
import PickupMapModal from '../components/PickupMapModal';
import Seo from '../components/Seo';
import CheckoutEmptyState from '../features/checkout/CheckoutEmptyState';
import CheckoutFlow from '../features/checkout/CheckoutFlow';
import CheckoutGuestPanel from '../features/checkout/CheckoutGuestPanel';
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

  const handleGuestCheckout = () => {
    if (checkout.isSubmitting) {
      return;
    }
    checkout.clearStatus();
    checkout.clearRecoveryState();
    checkout.setActiveStep(0);
    const emailInput = document.getElementById('checkout-email');
    if (emailInput && typeof emailInput.focus === 'function') {
      emailInput.focus();
    }
  };

  return (
    <div className="checkout-page page-section pb-28 lg:pb-10">
      <Seo
        title="Оформление заказа"
        description="Быстрое оформление заказа с выбором доставки, итоговой суммой до оплаты и возможностью купить без регистрации."
        canonicalPath="/checkout"
        robots="noindex,nofollow"
      />
      <div className="page-shell">
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

        <CheckoutGuestPanel
          isSubmitting={checkout.isSubmitting}
          onDisabledNavigation={handleDisabledNavigation}
          onGuestCheckout={handleGuestCheckout}
        />

        <CheckoutFlow checkout={checkout} />
      </div>

      <PickupMapModal
        open={checkout.isPickupMapOpen}
        points={checkout.enrichedPickupPoints}
        selectedPointId={checkout.selectedPickupPointId}
        searchLabel={checkout.pickupLocation}
        errorMessage={checkout.deliveryError}
        isLoading={checkout.pickupLoading || checkout.pickupAutoDetecting}
        onRetry={() =>
          (checkout.pickupLocation.trim()
            ? checkout.handlePickupSearch()
            : checkout.handleOpenPickupMap())
        }
        onMapViewportChange={checkout.handleMapViewportChange}
        onClose={() => checkout.setIsPickupMapOpen(false)}
        onSelect={(point) => {
          checkout.handlePickupPointSelect(point);
          checkout.setIsPickupMapOpen(false);
        }}
      />
    </div>
  );
}

export default CheckoutPage;
