import React from 'react';
import { Button } from '../ui';

function CarouselControls({
  currentIndex = 0,
  totalSlides = 0,
  label = 'Карусель',
  onNext,
  onPrev,
  onSelect
}) {
  if (totalSlides <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={onPrev}
          aria-label={`Предыдущий слайд: ${label}`}
        >
          ←
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={onNext}
          aria-label={`Следующий слайд: ${label}`}
        >
          →
        </Button>
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSlides }).map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={`${label}-dot-${index}`}
              type="button"
              onClick={() => onSelect(index)}
              className={`touch-target rounded-full transition ${
                isActive
                  ? 'h-2.5 w-6 bg-primary'
                  : 'h-2.5 w-2.5 bg-ink/20'
              }`}
              aria-label={`Перейти к слайду ${index + 1}`}
              aria-pressed={isActive}
            />
          );
        })}
      </div>
    </div>
  );
}

export default CarouselControls;
