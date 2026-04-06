import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PaymentConfigProvider } from './contexts/PaymentConfigContext';
import App from './pages/App';
import { initYandexMetrika } from './utils/metrika';
import { resolveAppBasePath } from './utils/url';
import './index.css';
import './styles/legal.css';

const basename = resolveAppBasePath();
initYandexMetrika();

// Create React root and mount the application. Wrapping the app with
// BrowserRouter enables client‑side routing throughout the site.
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <NotificationProvider>
        <AuthProvider>
          <PaymentConfigProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </PaymentConfigProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);
