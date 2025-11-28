import React, { useContext } from 'react';
import { CartContext } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder } from '../api';
import { moneyToNumber } from '../utils/product';

function CartPage() {
  const { items, addItem, removeItem, updateQuantity, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  // Compute cart total amount
  const total = items.reduce(
    (sum, item) => sum + (item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity,
    0
  );

  const handleCheckout = async () => {
    // Require login before checkout
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    try {
      const cartId = localStorage.getItem('cartId');
      const order = await createOrder(cartId);
      clearCart();
      // Redirect to account/orders page or show confirmation
      alert(`Заказ оформлен! Номер заказа: ${order.id}`);
      navigate('/account');
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Ошибка при оформлении заказа. Пожалуйста, попробуйте ещё раз.');
    }
  };

  return (
    <div className="cart-page py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-semibold mb-4">Корзина</h1>
        {items.length === 0 ? (
          <p>
            Ваша корзина пуста. Перейдите в{' '}
            <Link to="/" className="text-primary underline">
              каталог
            </Link>{' '}
            для выбора товаров.
          </p>
        ) : (
          <div className="flex flex-wrap gap-8">
            {/* Cart items list */}
            <div className="flex-1 min-w-[280px] max-w-2xl">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-4 border-b border-gray-200 py-4"
                >
                  {/* Item image placeholder */}
                  <div className="w-20 h-20 bg-[#e9e7e3] rounded" />
                  {/* Item details */}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium m-0">
                      {item.productInfo?.name || 'Товар'}
                    </h4>
                    <p className="text-xs text-muted m-0">
                      {item.productInfo?.variantName ? `Вариант: ${item.productInfo.variantName}` : item.variantId}
                    </p>
                    <div className="text-primary font-semibold">
                      {(item.unitPriceValue || moneyToNumber(item.unitPrice)).toLocaleString('ru-RU')}{' '}
                      ₽
                    </div>
                    <div className="flex items-center mt-1 space-x-2 text-sm">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                        className="border border-gray-300 px-2 rounded"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                        className="border border-gray-300 px-2 rounded"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => removeItem(item.id)} 
                        className="text-muted hover:text-primary ml-4"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Order summary and actions */}
            <div className="flex-1 min-w-[250px] max-w-xs border border-gray-200 rounded p-4 bg-white">
              <h3 className="text-xl font-semibold mb-3">Сводка заказа</h3>
              <div className="flex justify-between mb-2 text-sm">
                <span>Товары ({items.length})</span>
                <span>{total.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span>Доставка</span>
                <span>0 ₽</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-base mb-4">
                <span>Итого</span>
                <span>{total.toLocaleString('ru-RU')} ₽</span>
              </div>
              <button 
                className="button w-full mb-2" 
                onClick={handleCheckout}
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
