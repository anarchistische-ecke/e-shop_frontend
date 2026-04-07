import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { Button, Card } from '../components/ui';

function NotFound() {
  return (
    <div className="not-found py-8 md:py-12">
      <Seo
        title="Страница не найдена"
        description="Запрошенная страница не существует или была перемещена. Попробуйте вернуться на главную."
        canonicalPath="/404"
        robots="noindex,nofollow"
      />
      <div className="container mx-auto px-4 text-center">
        <Card className="text-center" padding="lg">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">404 — Страница не найдена</h1>
          <p className="mb-4 text-muted">К сожалению, запрашиваемая страница не существует или была удалена.</p>
          <Button as={Link} to="/">
            Вернуться на главную
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default NotFound;
