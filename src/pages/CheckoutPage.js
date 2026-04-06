import React, { useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import NotificationBanner from '../components/NotificationBanner';
import PickupMapModal from '../components/PickupMapModal';
import CheckoutStepper from '../features/checkout/CheckoutStepper';
import CheckoutSummary from '../features/checkout/CheckoutSummary';
import ContactStep from '../features/checkout/ContactStep';
import RecipientStep from '../features/checkout/RecipientStep';
import DeliveryStep from '../features/checkout/DeliveryStep';
import ReviewStep from '../features/checkout/ReviewStep';
import { CHECKOUT_STEPS } from '../features/checkout/constants';
import { useCheckoutState } from '../features/checkout/useCheckoutState';

function CheckoutPage() {
  const statusRef = useRef(null);
  const {
    isManager,
    activeStep,
    setActiveStep,
    completedSteps,
    fieldErrors,
    clearFieldError,
    email,
    setEmail,
    recipientFirstName,
    setRecipientFirstName,
    recipientLastName,
    setRecipientLastName,
    recipientPhone,
    setRecipientPhone,
    deliveryType,
    setDeliveryType,
    deliveryAddress,
    setDeliveryAddress,
    deliveryAddressDetails,
    setDeliveryAddressDetails,
    showDeliveryAddressDetails,
    setShowDeliveryAddressDetails,
    pickupLocation,
    setPickupLocation,
    pickupGeoId,
    selectedPickupPoint,
    selectedPickupPointId,
    selectedPickupPointName,
    deliveryOffers,
    selectedOfferId,
    setSelectedOfferId,
    pickupLoading,
    pickupAutoDetecting,
    deliveryLoading,
    deliveryError,
    topNotification,
    isSubmitting,
    savePaymentMethod,
    setSavePaymentMethod,
    isPickupMapOpen,
    setIsPickupMapOpen,
    expressMessage,
    submitLabel,
    safeRetryState,
    handleSafeRetry,
    items,
    itemsCount,
    total,
    deliveryLabel,
    payableTotal,
    reviewDeliveryLabel,
    fullDeliveryAddress,
    enrichedPickupPoints,
    handleMapViewportChange,
    handlePickupSearch,
    handleOpenPickupMap,
    handlePickupPointSelect,
    handleFetchOffers,
    handleExpressCheckout,
    handleContactNext,
    handleRecipientNext,
    handleDeliveryNext,
    handleSubmit,
    handleEmailBlur,
    formatInterval,
    formatRub,
    moneyToNumber,
    isAuthenticated,
    clearStatus,
    clearRecoveryState,
    mobileAction
  } = useCheckoutState();

  useEffect(() => {
    if (!topNotification || isSubmitting || !statusRef.current) {
      return;
    }
    statusRef.current.focus();
  }, [isSubmitting, topNotification]);

  if (isManager) {
    return <Navigate to="/cart" replace />;
  }

  if (!items.length) {
    return (
      <div className="checkout-page py-10">
        <div className="container mx-auto px-4">
          <div className="soft-card p-8 text-center">
            <h1 className="text-2xl font-semibold">Корзина пуста</h1>
            <p className="mt-2 text-sm text-muted">
              Добавьте товары в корзину, чтобы перейти к оформлению заказа.
            </p>
            <Link to="/cart" className="button mt-5">
              Вернуться в корзину
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const disabledLinkClass = isSubmitting ? ' pointer-events-none opacity-60' : '';
  const handleDisabledNavigation = (event) => {
    if (isSubmitting) {
      event.preventDefault();
    }
  };
  const handleGuestCheckout = () => {
    if (isSubmitting) {
      return;
    }
    clearStatus();
    clearRecoveryState();
    setActiveStep(0);
    const emailInput = document.getElementById('checkout-email');
    if (emailInput && typeof emailInput.focus === 'function') {
      emailInput.focus();
    }
  };

  return (
    <div className="checkout-page py-7 pb-28 md:py-10 lg:pb-10">
      <div className="container mx-auto px-4">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Оформление заказа</p>
            <h1 className="text-3xl sm:text-4xl font-semibold">
              Быстрое оформление без лишних шагов
            </h1>
            <p className="mt-1 text-sm text-muted">
              Вы выбираете доставку и полную стоимость до оплаты. Регистрация не обязательна.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/info/delivery"
              className={`button-ghost text-sm${disabledLinkClass}`}
              aria-disabled={isSubmitting}
              onClick={handleDisabledNavigation}
            >
              Поддержка и доставка
            </Link>
            <Link
              to="/cart"
              className={`button-ghost text-sm${disabledLinkClass}`}
              aria-disabled={isSubmitting}
              onClick={handleDisabledNavigation}
            >
              ← Вернуться в корзину
            </Link>
          </div>
        </div>

        {topNotification ? (
          <NotificationBanner
            ref={statusRef}
            notification={topNotification}
            tabIndex={-1}
            className="mb-5"
            onDismiss={!isSubmitting ? clearStatus : undefined}
          />
        ) : null}

        <div className="mb-5 rounded-[24px] border border-primary/20 bg-white/90 p-4 shadow-[0_18px_36px_rgba(43,39,34,0.08)]">
          <p className="text-sm font-semibold text-ink">Оформление как гость</p>
          <p className="mt-1 text-xs text-muted">
            Достаточно email и контакта получателя. Аккаунт можно использовать только если вам так удобнее.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="button-gray w-full justify-start text-left !py-2.5"
              onClick={handleGuestCheckout}
              disabled={isSubmitting}
            >
              Оформить как гость
            </button>
            <Link
              to="/login"
              className={`button-ghost w-full justify-start text-left !py-2.5${disabledLinkClass}`}
              aria-disabled={isSubmitting}
              onClick={handleDisabledNavigation}
            >
              Войти в аккаунт
            </Link>
          </div>
        </div>

        <CheckoutStepper
          steps={CHECKOUT_STEPS}
          activeStep={activeStep}
          completedSteps={completedSteps}
          disabled={isSubmitting}
        />

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
            <p className="text-xs text-muted">
              Поля с пометкой «обязательно» нужно заполнить для продолжения.
            </p>

            <ContactStep
              active={activeStep === 0}
              email={email}
              savePaymentMethod={savePaymentMethod}
              isAuthenticated={isAuthenticated}
              fieldErrors={fieldErrors}
              onEmailChange={(value) => {
                clearStatus();
                clearRecoveryState();
                clearFieldError('email');
                setEmail(value);
              }}
              onEmailBlur={handleEmailBlur}
              onSavePaymentMethodChange={(value) => {
                clearStatus();
                clearRecoveryState();
                setSavePaymentMethod(value);
              }}
              onContinue={handleContactNext}
              onEdit={() => setActiveStep(0)}
              disabled={isSubmitting}
            />

            <RecipientStep
              active={activeStep === 1}
              recipientFirstName={recipientFirstName}
              recipientLastName={recipientLastName}
              recipientPhone={recipientPhone}
              fieldErrors={fieldErrors}
              onRecipientFirstNameChange={(value) => {
                clearStatus();
                clearRecoveryState();
                clearFieldError('recipientFirstName');
                setRecipientFirstName(value);
              }}
              onRecipientLastNameChange={(value) => {
                clearStatus();
                clearRecoveryState();
                setRecipientLastName(value);
              }}
              onRecipientPhoneChange={(value) => {
                clearStatus();
                clearRecoveryState();
                clearFieldError('recipientPhone');
                setRecipientPhone(value);
              }}
              onContinue={handleRecipientNext}
              onEdit={() => setActiveStep(1)}
              disabled={isSubmitting}
            />

            <DeliveryStep
              active={activeStep === 2}
              deliveryType={deliveryType}
              deliveryAddress={deliveryAddress}
              deliveryAddressDetails={deliveryAddressDetails}
              showDeliveryAddressDetails={showDeliveryAddressDetails}
              pickupLocation={pickupLocation}
              pickupGeoId={pickupGeoId}
              selectedPickupPoint={selectedPickupPoint}
              selectedPickupPointName={selectedPickupPointName}
              pickupLoading={pickupLoading}
              pickupAutoDetecting={pickupAutoDetecting}
              deliveryLoading={deliveryLoading}
              deliveryError={deliveryError}
              deliveryOffers={deliveryOffers}
              selectedOfferId={selectedOfferId}
              fieldErrors={fieldErrors}
              formatInterval={formatInterval}
              formatRub={formatRub}
              moneyToNumber={moneyToNumber}
              reviewDeliveryLabel={reviewDeliveryLabel}
              onDeliveryTypeChange={(nextType) => {
                clearStatus();
                clearRecoveryState();
                setDeliveryType(nextType);
              }}
              onDeliveryAddressChange={(value) => {
                clearStatus();
                clearRecoveryState();
                clearFieldError('deliveryAddress');
                setDeliveryAddress(value);
              }}
              onDeliveryAddressDetailsChange={(value) => {
                clearStatus();
                clearRecoveryState();
                setDeliveryAddressDetails(value);
              }}
              onToggleDeliveryAddressDetails={() => {
                setShowDeliveryAddressDetails((prev) => !prev);
              }}
              onPickupLocationChange={(value) => {
                clearStatus();
                clearRecoveryState();
                clearFieldError('pickupLocation');
                setPickupLocation(value);
              }}
              onPickupSearch={handlePickupSearch}
              onOpenPickupMap={handleOpenPickupMap}
              onOfferSelect={(offerId) => {
                clearStatus();
                clearRecoveryState();
                setSelectedOfferId(offerId);
              }}
              onFetchOffers={handleFetchOffers}
              onContinue={handleDeliveryNext}
              onEdit={() => setActiveStep(2)}
              disabled={isSubmitting}
            />

            <ReviewStep
              active={activeStep === 3}
              email={email}
              recipientFirstName={recipientFirstName}
              recipientLastName={recipientLastName}
              recipientPhone={recipientPhone}
              reviewDeliveryLabel={reviewDeliveryLabel}
              deliveryType={deliveryType}
              fullDeliveryAddress={fullDeliveryAddress}
              selectedPickupPoint={selectedPickupPoint}
              selectedPickupPointName={selectedPickupPointName}
              expressMessage={expressMessage}
              safeRetryState={safeRetryState}
              isSubmitting={isSubmitting}
              submitLabel={submitLabel}
              onEditContact={() => setActiveStep(0)}
              onEditRecipient={() => setActiveStep(1)}
              onEditDelivery={() => setActiveStep(2)}
              onOpen={() => setActiveStep(3)}
              onExpressCheckout={handleExpressCheckout}
              onSubmit={handleSubmit}
              onSafeRetry={handleSafeRetry}
            />
          </form>

          <CheckoutSummary
            items={items}
            itemsCount={itemsCount}
            total={total}
            deliveryLabel={deliveryLabel}
            payableTotal={payableTotal}
            formatRub={formatRub}
            mobileAction={mobileAction}
          />
        </div>
      </div>

      <PickupMapModal
        open={isPickupMapOpen}
        points={enrichedPickupPoints}
        selectedPointId={selectedPickupPointId}
        searchLabel={pickupLocation}
        errorMessage={deliveryError}
        isLoading={pickupLoading || pickupAutoDetecting}
        onRetry={() => (pickupLocation.trim() ? handlePickupSearch() : handleOpenPickupMap())}
        onMapViewportChange={handleMapViewportChange}
        onClose={() => setIsPickupMapOpen(false)}
        onSelect={(point) => {
          handlePickupPointSelect(point);
          setIsPickupMapOpen(false);
        }}
      />
    </div>
  );
}

export default CheckoutPage;
