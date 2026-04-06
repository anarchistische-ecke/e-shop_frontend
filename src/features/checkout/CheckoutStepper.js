import React from 'react';
import { Card } from '../../components/ui';

function CheckoutStepper({ steps, activeStep, completedSteps, disabled = false }) {
  return (
    <Card className="mb-6 p-4 md:p-5">
      <ol className="grid gap-2 sm:grid-cols-4" aria-label="Прогресс оформления заказа">
        {steps.map((step, index) => {
          const isActive = activeStep === index;
          const isDone = Boolean(completedSteps[step.key]) || index < activeStep;
          return (
            <li
              key={step.key}
              aria-current={isActive ? 'step' : undefined}
              aria-disabled={disabled || undefined}
              className={`rounded-2xl border px-3 py-3 text-sm transition ${
                isActive
                  ? 'border-primary/35 bg-primary/10'
                  : isDone
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-ink/10 bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    isDone ? 'bg-emerald-600 text-white' : isActive ? 'bg-primary text-white' : 'bg-secondary text-muted'
                  }`}
                >
                  {isDone ? '✓' : index + 1}
                </span>
                <span className="font-semibold">{step.title}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

export default CheckoutStepper;
