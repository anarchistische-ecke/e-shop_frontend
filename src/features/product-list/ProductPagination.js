import React from 'react';
import { Button, PaginationButton } from '../../components/ui';

function ProductPagination({
  safePage,
  totalPages,
  visiblePages,
  onPageChange
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
        >
          Назад
        </Button>
        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted">
                ...
              </span>
            );
          }

          return (
            <PaginationButton
              key={page}
              type="button"
              active={page === safePage}
              onClick={() => onPageChange(page)}
            >
              {page}
            </PaginationButton>
          );
        })}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
        >
          Вперёд
        </Button>
      </div>
      <p className="text-xs text-muted">
        Страница {safePage} из {totalPages}
      </p>
    </div>
  );
}

export default ProductPagination;
