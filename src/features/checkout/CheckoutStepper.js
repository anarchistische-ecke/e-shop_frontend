import React from 'react';

function CheckoutStepper({ steps, activeStep, completedSteps }) {
  return (
    <ol className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-6" aria-label="Прогресс оформления заказа">
      {steps.map((step, index) => {
        const isActive = activeStep === index;
        const isDone = Boolean(completedSteps[step.key]) || index < activeStep;

        return (
          <li
            key={step.key}
            aria-current={isActive ? 'step' : undefined}
            className={`flex items-start gap-2 border-b-2 pb-3 text-xs font-semibold leading-snug sm:items-center sm:text-sm ${
              isActive ? 'border-primary text-primary' : 'border-ink/10 text-muted'
            }`}
          >
            <span
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs ${
                isActive ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
              }`}
              aria-hidden="true"
            >
              {isDone && !isActive ? '✓' : index + 1}
            </span>
            <span className="pt-1 sm:pt-0">{step.title}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default CheckoutStepper;
