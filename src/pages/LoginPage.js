import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginCustomer } from '../api';

/**
 * LoginPage allows a customer to log in via SMS code or password. We have implemented the password flow to authenticate with the backend.
 */
function LoginPage() {
  const [tab, setTab] = useState('sms');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSmsSubmit = (e) => {
    e.preventDefault();
    alert('Код отправлен на номер ' + phone);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await loginCustomer(phone, password);
      localStorage.setItem('userToken', result.token);
      alert('Вход выполнен');  
      navigate('/');
    } catch (err) {
      console.error('Failed to login customer:', err);
      alert('Ошибка входа');   
    }
  };

  return (
    <div className="login-page py-8">
      <div className="container mx-auto px-4 max-w-sm">
        <h1 className="text-2xl font-semibold mb-4">Вход или регистрация</h1>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setTab('sms')}
            className={`flex-1 py-2 text-center border-b ${tab === 'sms' ? 'border-b-2 border-primary font-semibold' : 'border-gray-200'}`}
          >
            Через SMS
          </button>
          <button
            onClick={() => setTab('password')}
            className={`flex-1 py-2 text-center border-b ${tab === 'password' ? 'border-b-2 border-primary font-semibold' : 'border-gray-200'}`}
          >
            По паролю
          </button>
        </div>
        {tab === 'sms' && (
          <form onSubmit={handleSmsSubmit} className="flex flex-col gap-4">
            <input
              type="tel"
              placeholder="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="p-2 border border-gray-300 rounded"
            />
            <button type="submit" className="button">Получить код</button>
            {code && (
              <input
                type="text"
                placeholder="Введите код"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="p-2 border border-gray-300 rounded"
              />
            )}
          </form>
        )}
        {tab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Телефон или e‑mail"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
            <input
              type="password"
              placeholder="Пароль"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
            <button type="submit" className="button">Войти</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;