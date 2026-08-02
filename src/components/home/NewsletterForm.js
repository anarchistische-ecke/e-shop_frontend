import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Input } from '../ui';
import { createMarketingSubscription } from '../../api';
import { METRIKA_GOALS, trackGoal } from '../../utils/metrika';

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = email.trim();
    const isValid = /\S+@\S+\.\S+/.test(value);

    if (!isValid) {
      setStatus({
        type: 'error',
        message: 'Введите адрес электронной почты в формате pochta@example.ru.'
      });
      return;
    }
    if (!consent) {
      setStatus({
        type: 'error',
        message: 'Подтвердите согласие на рекламную рассылку.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createMarketingSubscription({
        email: value,
        consent: true,
        source: 'home_newsletter'
      });
      trackGoal(METRIKA_GOALS.NEWSLETTER_SUBMIT, { source: 'home_newsletter' });
      setStatus({
        type: 'success',
        message: 'Проверьте почту и подтвердите подписку по ссылке в течение 24 часов.'
      });
      setEmail('');
      setConsent(false);
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Не удалось отправить письмо. Попробуйте ещё раз немного позже.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="newsletter" className="page-shell page-section">
      <Card
        padding="lg"
        className="rounded-[32px] border border-primary/20 bg-gradient-to-br from-white via-white to-blush/65"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:gap-6 lg:items-end">
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
              placeholder="Ваша электронная почта"
              aria-label="Электронная почта для рассылки"
            />
            <label className="flex items-start gap-2 text-xs leading-relaxed text-muted">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => {
                  setConsent(event.target.checked);
                  if (status) setStatus(null);
                }}
                className="mt-0.5"
              />
              <span>
                Я согласен(на) получать рекламную рассылку и принимаю{' '}
                <Link className="underline hover:text-primary" to="/konfidentsialnost-i-zashchita-informatsii">
                  политику конфиденциальности
                </Link>.
              </span>
            </label>
            <Button type="submit" block disabled={isSubmitting}>
              {isSubmitting ? 'Отправляем…' : 'Подписаться'}
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
