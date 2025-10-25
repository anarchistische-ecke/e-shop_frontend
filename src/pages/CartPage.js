import React, { useContext } from 'react';
import { CartContext } from '../contexts/CartContext';
import { Link } from 'react-router-dom';

/**
 * CartPage displays the contents of the shopping cart.  Users can
 * increment, decrement or remove items, and view an order summary.
 * Since this is a front‑end only application there is no actual
 * checkout process; the “Оформить заказ” button serves as a
 * placeholder for future integration.
 */
function CartPage() {
  const { items, addItem, removeItem, updateQuantity, clearCart } = useContext(CartContext);

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="cart-page py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-semibold mb-4">Корзина</h1>
        {items.length === 0 ? (
          <p>
            Ваша корзина пуста. Перейдите в{' '}
            <Link to="/" className="text-primary underline">
              каталог
            </Link>
            , чтобы добавить товары.
          </p>
        ) : (
          <div className="flex flex-wrap gap-8">
            {/* Item list */}
            <div className="flex-1 min-w-[280px] max-w-[700px]">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-4 border-b border-gray-200 py-4"
                >
                  <div className="w-20 h-20 bg-[#e9e7e3] rounded"></div>
                  <div className="flex-1">
                    <h4 className="m-0 text-sm font-medium">{item.product.name}</h4>
                    <div className="text-primary font-semibold">
                      {item.product.price.toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="flex items-center mt-1 space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="border border-gray-300 px-2 rounded"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="border border-gray-300 px-2 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-semibold">
                      {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽
                    </span>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-muted text-sm hover:text-primary"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Summary */}
            <div className="flex-1 min-w-[250px] border border-gray-200 rounded p-4 bg-white max-w-sm">
              <h3 className="text-xl font-semibold mb-2">Сводка заказа</h3>
              <div className="flex justify-between mb-2">
                <span>Товары ({items.length})</span>
                <span>{total.toLocaleString('ru-RU')} ₽</span>
              </div>
              {/* Placeholder for shipping calculation */}
              <div className="flex justify-between mb-2">
                <span>Доставка</span>
                <span>0 ₽</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold my-4">
                <span>Итого</span>
                <span>{total.toLocaleString('ru-RU')} ₽</span>
              </div>
              <button
                className="button w-full mb-2"
                onClick={() => alert('Завершение заказа не реализовано')}
              >
                Оформить заказ
              </button>
              <button
                className="button-gray w-full"
                onClick={clearCart}
              >
                Очистить корзину
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;