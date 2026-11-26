import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '../ui';
import { createMarketingSubscription } from '../../api';
import { METRIKA_GOALS, trackGoal } from '../../utils/metrika';

function NewsletterForm() {
  const consentId = useId();
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
    <section id="newsletter" className="page-shell py-8 sm:py-10">
      <div className="grid gap-5 rounded-xl border border-ink/10 bg-[#f2efe6] p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,27rem)] lg:items-center lg:gap-10">
        <div>
          <h2 className="font-display text-2xl font-medium sm:text-[2rem]">Новости и предложения</h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            Новые коллекции, идеи для дома и предложения магазина на вашу почту.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status) setStatus(null);
            }}
            placeholder="Ваша электронная почта"
            aria-label="Электронная почта для рассылки"
          />
          <div className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <input
              id={consentId}
              type="checkbox"
              checked={consent}
              aria-labelledby={`${consentId}-label ${consentId}-policy`}
              onChange={(event) => {
                setConsent(event.target.checked);
                if (status) setStatus(null);
              }}
              className="mt-0.5 accent-primary"
            />
            <p>
              <label id={`${consentId}-label`} htmlFor={consentId} className="cursor-pointer">
                Я согласен(на) получать рекламную рассылку и принимаю
              </label>{' '}
              <Link id={`${consentId}-policy`} className="underline hover:text-primary" to="/konfidentsialnost-i-zashchita-informatsii">
                политику конфиденциальности
              </Link>.
            </p>
          </div>
          <Button type="submit" block disabled={isSubmitting}>
            {isSubmitting ? 'Отправляем…' : 'Подписаться'}
          </Button>
          {status ? (
            <p role="status" className={`text-sm ${status.type === 'success' ? 'text-primary' : 'text-sale'}`}>
              {status.message}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}

export default NewsletterForm;
