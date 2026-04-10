import React, { useState } from 'react';
import { Button, Card, Input } from '../ui';

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = email.trim();
    const isValid = /\S+@\S+\.\S+/.test(value);

    if (!isValid) {
      setStatus({
        type: 'error',
        message: 'Введите email в формате name@example.ru.'
      });
      return;
    }

    setStatus({
      type: 'success',
      message: 'Спасибо. Мы будем присылать только полезные подборки и редкие акции.'
    });
    setEmail('');
  };

  return (
    <section className="page-shell page-section">
      <Card
        padding="lg"
        className="rounded-[32px] border border-primary/20 bg-gradient-to-br from-white via-white to-blush/65"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Рассылка</p>
            <h2 className="mt-3 text-2xl font-semibold md:text-3xl">
              Получайте новые коллекции и редкие предложения без шума
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              Один-два письма в месяц: новинки, готовые подборки и аккуратные акции,
              которые не затеряются в почте.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status) {
                  setStatus(null);
                }
              }}
              placeholder="Ваш email"
              aria-label="Email для рассылки"
            />
            <Button type="submit" block>
              Подписаться
            </Button>
            {status ? (
              <p
                className={`text-sm ${
                  status.type === 'success' ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {status.message}
              </p>
            ) : null}
          </form>
        </div>
      </Card>
    </section>
  );
}

export default NewsletterForm;
