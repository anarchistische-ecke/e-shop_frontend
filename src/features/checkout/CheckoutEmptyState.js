import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/ui';

function CheckoutEmptyState() {
  return (
    <div className="checkout-page py-10">
      <div className="container mx-auto px-4">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-semibold">Корзина пуста</h1>
          <p className="mt-2 text-sm text-muted">
            Добавьте товары в корзину, чтобы перейти к оформлению заказа.
          </p>
          <Button as={Link} to="/cart" className="mt-5">
            Вернуться в корзину
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default CheckoutEmptyState;
