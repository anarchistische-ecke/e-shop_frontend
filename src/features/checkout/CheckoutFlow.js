import React from 'react';
import CheckoutStepper from './CheckoutStepper';
import CheckoutSummary from './CheckoutSummary';
import ContactStep from './ContactStep';
import AddressStep from './AddressStep';
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

      <div className="page-grid--sidebar gap-7">
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
            customerName={checkout.customerName}
            phone={checkout.phone}
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
            onCustomerNameChange={(value) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.clearFieldError('customerName');
              checkout.setCustomerName(value);
            }}
            onPhoneChange={(value) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.clearFieldError('phone');
              checkout.setPhone(value);
            }}
            onSavePaymentMethodChange={(value) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.setSavePaymentMethod(value);
            }}
            onContinue={checkout.handleContactNext}
            onEdit={() => checkout.setActiveStep(0)}
            disabled={checkout.isSubmitting}
          />

          <AddressStep
            active={checkout.activeStep === 1}
            homeAddress={checkout.homeAddress}
            deliveryNotice={checkout.deliveryNotice}
            fieldErrors={checkout.fieldErrors}
            onHomeAddressChange={(value) => {
              checkout.clearStatus();
              checkout.clearRecoveryState();
              checkout.clearFieldError('homeAddress');
              checkout.setHomeAddress(value);
            }}
            onContinue={checkout.handleAddressNext}
            onEdit={() => checkout.setActiveStep(1)}
            disabled={checkout.isSubmitting}
          />

          <ReviewStep
            active={checkout.activeStep === 2}
            email={checkout.email}
            customerName={checkout.customerName}
            phone={checkout.phone}
            reviewDeliveryLabel={checkout.reviewDeliveryLabel}
            homeAddress={checkout.homeAddress}
            deliveryNotice={checkout.deliveryNotice}
            safeRetryState={checkout.safeRetryState}
            isSubmitting={checkout.isSubmitting}
            submitLabel={checkout.submitLabel}
            onEditContact={() => checkout.setActiveStep(0)}
            onEditAddress={() => checkout.setActiveStep(1)}
            onOpen={() => checkout.setActiveStep(2)}
            onSubmit={checkout.handleSubmit}
            onSafeRetry={checkout.handleSafeRetry}
          />
        </form>

        <CheckoutSummary
          items={checkout.items}
          itemsCount={checkout.itemsCount}
          pricing={checkout.pricing}
          total={checkout.total}
          deliveryLabel={checkout.deliveryLabel}
          payableTotal={checkout.payableTotal}
          formatRub={checkout.formatRub}
          mobileAction={checkout.mobileAction}
          deliveryNotice={checkout.deliveryNotice}
        />
      </div>
    </>
  );
}

export default CheckoutFlow;
