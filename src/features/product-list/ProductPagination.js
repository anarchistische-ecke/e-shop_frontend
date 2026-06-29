import React from 'react';
import { Button } from '../../components/ui';

function ProductPagination({
  safePage,
  totalPages,
  onPageChange
}) {
  if (totalPages <= 1 || safePage >= totalPages) {
    return null;
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <Button
        type="button"
        variant="secondary"
        onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
      >
        Показать ещё
      </Button>
      <p className="text-xs text-muted">
        Показано {safePage} из {totalPages} страниц
      </p>
    </div>
  );
}

export default ProductPagination;
