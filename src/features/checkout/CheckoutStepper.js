import React from 'react';
import { Card } from '../../components/ui';

function CheckoutStepper({ steps, activeStep, completedSteps, disabled = false }) {
  return (
    <Card className="mb-5 p-3 xs:p-4 md:p-5">
      <ol className={`grid gap-2 ${steps.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`} aria-label="Прогресс оформления заказа">
        {steps.map((step, index) => {
          const isActive = activeStep === index;
          const isDone = Boolean(completedSteps[step.key]) || index < activeStep;
          return (
            <li
              key={step.key}
              aria-current={isActive ? 'step' : undefined}
              aria-disabled={disabled || undefined}
              className={`rounded-2xl border px-2 py-2.5 text-sm transition xs:px-3 xs:py-3 ${
                isActive
                  ? 'border-primary/35 bg-primary/10'
                  : isDone
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-ink/10 bg-white'
              }`}
            >
              <div className="flex min-h-[48px] items-center justify-center gap-2 xs:justify-start">
                <span
                  className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isDone ? 'bg-emerald-600 text-white' : isActive ? 'bg-primary text-white' : 'bg-secondary text-muted'
                  }`}
                >
                  {isDone ? '✓' : index + 1}
                </span>
                <span className="hidden font-semibold xs:inline">{step.title}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

export default CheckoutStepper;
