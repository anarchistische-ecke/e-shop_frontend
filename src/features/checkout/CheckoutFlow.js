import React from 'react';
import CheckoutStepper from './CheckoutStepper';
import CheckoutSummary from './CheckoutSummary';
import ContactStep from './ContactStep';
import DeliveryStep from './DeliveryStep';
import RecipientStep from './RecipientStep';
import ReviewStep from './ReviewStep';
import { CHECKOUT_STEPS } from './constants';

function CheckoutFlow({ checkout }) {
  return (
    <>
      <CheckoutStepper
        steps={CHECKOUT_STEPS}
        activeStep={checkout.activeStep}
        completedSteps={checkout.completedSteps}
        disabled={checkout.isSubmitting}
      />

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start">
        <form
          id="checkout-form"
          onSubmit={checkout.handleSubmit}
          className="space-y-5"
        >
          <p className="text-xs text-muted">
            Поля с пометкой «обязательно» нужно заполнить для продолжения.
          </p>

          <ContactStep
            active={checkout.activeStep === 0}
            email={checkout.email}
            savePaymentMethod={checkout.savePaymentMethod}
            isAuthenticated={checkout.isAuthenticated}
            fieldErrors={checkout.fieldErrors}
            onEmailChange={(value) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.clearFieldError('email');
              checkout.setEmail(value);
            }}
            onEmailBlur={checkout.handleEmailBlur}
            onSavePaymentMethodChange={(value) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.setSavePaymentMethod(value);
            }}
            onContinue={checkout.handleContactNext}
            onEdit={() => checkout.setActiveStep(0)}
            disabled={checkout.isSubmitting}
          />

          <RecipientStep
            active={checkout.activeStep === 1}
            recipientFirstName={checkout.recipientFirstName}
            recipientLastName={checkout.recipientLastName}
            recipientPhone={checkout.recipientPhone}
            fieldErrors={checkout.fieldErrors}
            onRecipientFirstNameChange={(value) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.clearFieldError('recipientFirstName');
              checkout.setRecipientFirstName(value);
            }}
            onRecipientLastNameChange={(value) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.setRecipientLastName(value);
            }}
            onRecipientPhoneChange={(value) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.clearFieldError('recipientPhone');
              checkout.setRecipientPhone(value);
            }}
            onContinue={checkout.handleRecipientNext}
            onEdit={() => checkout.setActiveStep(1)}
            disabled={checkout.isSubmitting}
          />

          <DeliveryStep
            active={checkout.activeStep === 2}
            deliveryType={checkout.deliveryType}
            deliveryAddress={checkout.deliveryAddress}
            deliveryAddressDetails={checkout.deliveryAddressDetails}
            showDeliveryAddressDetails={checkout.showDeliveryAddressDetails}
            pickupLocation={checkout.pickupLocation}
            pickupLocationHint={checkout.pickupLocationHint}
            pickupLocationSuggestion={checkout.pickupLocationSuggestion}
            pickupGeoId={checkout.pickupGeoId}
            selectedPickupPoint={checkout.selectedPickupPoint}
            selectedPickupPointName={checkout.selectedPickupPointName}
            pickupLoading={checkout.pickupLoading}
            pickupAutoDetecting={checkout.pickupAutoDetecting}
            deliveryLoading={checkout.deliveryLoading}
            deliveryError={checkout.deliveryError}
            deliveryOffers={checkout.deliveryOffers}
            selectedOfferId={checkout.selectedOfferId}
            fieldErrors={checkout.fieldErrors}
            formatInterval={checkout.formatInterval}
            formatRub={checkout.formatRub}
            moneyToNumber={checkout.moneyToNumber}
            reviewDeliveryLabel={checkout.reviewDeliveryLabel}
            onDeliveryTypeChange={(nextType) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.setDeliveryType(nextType);
            }}
            onDeliveryAddressChange={(value) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.clearFieldError('deliveryAddress');
              checkout.setDeliveryAddress(value);
            }}
            onDeliveryAddressDetailsChange={(value) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.setDeliveryAddressDetails(value);
            }}
            onToggleDeliveryAddressDetails={() => {
              checkout.setShowDeliveryAddressDetails((prev) => !prev);
            }}
            onPickupLocationChange={(value) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.clearFieldError('pickupLocation');
              checkout.setPickupLocation(value);
            }}
            onPickupSearch={checkout.handlePickupSearch}
            onOpenPickupMap={checkout.handleOpenPickupMap}
            onConfirmPickupLocationSuggestion={checkout.handleConfirmPickupLocationSuggestion}
            onDismissPickupLocationSuggestion={checkout.handleDismissPickupLocationSuggestion}
            onOfferSelect={(offerId) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.setSelectedOfferId(offerId);
            }}
            onFetchOffers={checkout.handleFetchOffers}
            onContinue={checkout.handleDeliveryNext}
            onEdit={() => checkout.setActiveStep(2)}
            disabled={checkout.isSubmitting}
          />

          <ReviewStep
            active={checkout.activeStep === 3}
            email={checkout.email}
            recipientFirstName={checkout.recipientFirstName}
            recipientLastName={checkout.recipientLastName}
            recipientPhone={checkout.recipientPhone}
            reviewDeliveryLabel={checkout.reviewDeliveryLabel}
            deliveryType={checkout.deliveryType}
            fullDeliveryAddress={checkout.fullDeliveryAddress}
            selectedPickupPoint={checkout.selectedPickupPoint}
            selectedPickupPointName={checkout.selectedPickupPointName}
            expressMessage={checkout.expressMessage}
            safeRetryState={checkout.safeRetryState}
            isSubmitting={checkout.isSubmitting}
            submitLabel={checkout.submitLabel}
            onEditContact={() => checkout.setActiveStep(0)}
            onEditRecipient={() => checkout.setActiveStep(1)}
            onEditDelivery={() => checkout.setActiveStep(2)}
            onOpen={() => checkout.setActiveStep(3)}
            onExpressCheckout={checkout.handleExpressCheckout}
            onSubmit={checkout.handleSubmit}
            onSafeRetry={checkout.handleSafeRetry}
          />
        </form>

        <CheckoutSummary
          items={checkout.items}
          itemsCount={checkout.itemsCount}
          total={checkout.total}
          deliveryLabel={checkout.deliveryLabel}
          payableTotal={checkout.payableTotal}
          formatRub={checkout.formatRub}
          mobileAction={checkout.mobileAction}
        />
      </div>
    </>
  );
}

export default CheckoutFlow;
