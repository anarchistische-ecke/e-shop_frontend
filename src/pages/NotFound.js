import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="not-found py-10">
      <div className="container mx-auto px-4 text-center">
        <div className="soft-card p-8">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">404 — Страница не найдена</h1>
          <p className="mb-4 text-muted">К сожалению, запрашиваемая страница не существует или была удалена.</p>
          <Link to="/" className="button">
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
