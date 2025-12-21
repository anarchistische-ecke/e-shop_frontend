import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="not-found py-8">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-3xl font-semibold mb-2">404 — Страница не найдена</h1>
        <p className="mb-4">К сожалению, запрашиваемая страница не существует или была удалена.</p>
        <Link to="/" className="button">
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}

export default NotFound;