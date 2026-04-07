const DEFAULT_WIDGET_SCRIPT_URL = 'https://yookassa.ru/checkout-widget/v1/checkout-widget.js';

let widgetScriptPromise = null;
let widgetScriptUrl = '';

function getWidgetConstructor() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.YooMoneyCheckoutWidget || null;
}

export function loadPaymentWidgetScript(scriptUrl = DEFAULT_WIDGET_SCRIPT_URL) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Платёжная форма недоступна вне браузера.'));
  }

  const targetUrl = scriptUrl || DEFAULT_WIDGET_SCRIPT_URL;
  const existingConstructor = getWidgetConstructor();
  if (existingConstructor) {
    return Promise.resolve(existingConstructor);
  }

  if (widgetScriptPromise && widgetScriptUrl === targetUrl) {
    return widgetScriptPromise;
  }

  widgetScriptUrl = targetUrl;
  widgetScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${targetUrl}"]`);
    const handleReady = () => {
      const WidgetConstructor = getWidgetConstructor();
      if (!WidgetConstructor) {
        reject(new Error('Платёжный виджет не инициализировался.'));
        return;
      }
      resolve(WidgetConstructor);
    };

    const handleError = () => {
      reject(new Error('Не удалось загрузить библиотеку платёжной формы.'));
    };

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        handleReady();
        return;
      }
      existingScript.addEventListener('load', handleReady, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = targetUrl;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      handleReady();
    };
    script.onerror = handleError;
    document.head.appendChild(script);
  }).catch((error) => {
    widgetScriptPromise = null;
    widgetScriptUrl = '';
    throw error;
  });

  return widgetScriptPromise;
}
