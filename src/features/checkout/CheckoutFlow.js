import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import CheckoutStepper from './CheckoutStepper';
import CheckoutSummary from './CheckoutSummary';
import ContactStep from './ContactStep';
import AddressStep from './AddressStep';
import ConfirmationStep from './ConfirmationStep';
import { CHECKOUT_STEPS } from './constants';
import { CHECKOUT_TRUST_LINK_IDS, TRUST_LINKS_BY_ID } from '../../data/trustLinks';
import { useCmsSiteSettings } from '../../contexts/CmsContentContext';
import { DELIVERY_SEPARATE_PAYMENT_NOTE } from '../../utils/delivery';
import { Button } from '../../components/ui';

function CheckoutFlow({ checkout }) {
  const { siteSettings } = useCmsSiteSettings();
  const supportPhone = siteSettings?.supportPhone?.replace(/[^\d+]/g, '');
  const isReview = checkout.activeStep === 1;
  const primaryActionKey = isReview ? (checkout.safeRetryState ? 'retry' : 'review') : 'contact';
  const [visibleActionKey, setVisibleActionKey] = useState('');
  const previousStep = useRef(checkout.activeStep);
  const editTarget = useRef('');
  const formRef = useRef(null);
  const primaryActionRef = useRef(null);

  useEffect(() => {
    const primaryAction = primaryActionRef.current;
    if (!primaryAction || !window.IntersectionObserver) return undefined;

    const threshold = 0.99;
    const observer = new window.IntersectionObserver(([entry]) => {
      setVisibleActionKey(entry.intersectionRatio >= threshold ? primaryActionKey : '');
    }, { threshold, rootMargin: '-12px 0px -96px 0px' });
    observer.observe(primaryAction);
    return () => observer.disconnect();
  }, [primaryActionKey]);

  useEffect(() => {
    if (previousStep.current === checkout.activeStep) return;
    previousStep.current = checkout.activeStep;
    if (Object.values(checkout.fieldErrors).some(Boolean)) return;

    const targetId = isReview ? 'checkout-review-title' : editTarget.current || 'checkout-contact-title';
    editTarget.current = '';
    formRef.current?.querySelector(`#${targetId}`)?.focus();
  }, [checkout.activeStep, checkout.fieldErrors, isReview]);

  const edit = (targetId) => {
    editTarget.current = targetId;
    checkout.setActiveStep(0);
  };

  const handleSubmit = (event) => {
    if (isReview) {
      checkout.handleSubmit(event);
    } else {
      event.preventDefault();
      checkout.handleContactAddressNext();
    }
  };

  return (
    <>
      <CheckoutStepper steps={CHECKOUT_STEPS} activeStep={checkout.activeStep} completedSteps={checkout.completedSteps} />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:gap-8 xl:gap-10">
        <CheckoutSummary
          items={checkout.items}
          itemsCount={checkout.itemsCount}
          pricing={checkout.pricing}
          total={checkout.total}
          payableTotal={checkout.payableTotal}
          formatRub={checkout.formatRub}
          isSubmitting={checkout.isSubmitting}
        />

        <form
          id="checkout-form"
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="min-w-0 rounded-lg border border-line bg-white p-4 sm:p-6 lg:col-start-1 lg:row-start-1 lg:p-7"
        >
          {isReview ? (
            <ConfirmationStep
              email={checkout.email}
              customerName={checkout.customerName}
              phone={checkout.phone}
              homeAddress={checkout.homeAddress}
              safeRetryState={checkout.safeRetryState}
              isSubmitting={checkout.isSubmitting}
              submitLabel={checkout.submitLabel}
              primaryActionRef={primaryActionRef}
              onEditContact={() => edit('checkout-contact-title')}
              onEditAddress={() => edit('checkout-address-title')}
              onSafeRetry={checkout.handleSafeRetry}
            />
          ) : (
            <>
              <ContactStep
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
                disabled={checkout.isSubmitting}
              />

              <AddressStep
                addressParts={checkout.addressParts}
                deliveryNotice={checkout.deliveryNotice}
                fieldErrors={checkout.fieldErrors}
                submitLabel={checkout.submitLabel}
                primaryActionRef={primaryActionRef}
                onAddressPartChange={(field, value) => {
                  checkout.clearStatus();
                  checkout.clearRecoveryState();
                  checkout.clearFieldError('homeAddress');
                  checkout.updateAddressPart(field, value);
                }}
                disabled={checkout.isSubmitting}
              />
            </>
          )}
        </form>
      </div>

      <nav className="mt-6 flex flex-wrap gap-x-4 border-t border-line pt-1 text-xs text-muted" aria-label="Помощь с заказом">
        {CHECKOUT_TRUST_LINK_IDS.map((id) => (
          <Link
            key={id}
            to={TRUST_LINKS_BY_ID[id].path}
            className="inline-flex min-h-11 items-center underline-offset-4 hover:text-primary hover:underline aria-disabled:pointer-events-none aria-disabled:opacity-60"
            aria-disabled={checkout.isSubmitting}
            onClick={checkout.isSubmitting ? (event) => event.preventDefault() : undefined}
          >
            {TRUST_LINKS_BY_ID[id].title}
          </Link>
        ))}
        {supportPhone ? (
          <a
            href={`tel:${supportPhone}`}
            className="inline-flex min-h-11 items-center underline-offset-4 hover:text-primary hover:underline aria-disabled:pointer-events-none aria-disabled:opacity-60"
            aria-disabled={checkout.isSubmitting}
            onClick={checkout.isSubmitting ? (event) => event.preventDefault() : undefined}
          >
            Нужна помощь? Позвонить
          </a>
        ) : null}
      </nav>

      {visibleActionKey !== primaryActionKey ? (
        <div className="checkout-mobile-action fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2 transition-transform duration-200 lg:hidden">
          <div className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="whitespace-nowrap text-lg font-semibold leading-tight tabular-nums">{checkout.formatRub(checkout.payableTotal)}</p>
              <p id="mobile-checkout-delivery-note" className="mt-0.5 text-xs text-muted">{DELIVERY_SEPARATE_PAYMENT_NOTE}</p>
            </div>
            <Button
              type={checkout.safeRetryState ? 'button' : 'submit'}
              form="checkout-form"
              className="min-w-0 !px-3 text-sm"
              onClick={checkout.safeRetryState ? checkout.handleSafeRetry : undefined}
              disabled={checkout.isSubmitting}
              aria-describedby="mobile-checkout-delivery-note"
            >
              {checkout.submitLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default CheckoutFlow;
