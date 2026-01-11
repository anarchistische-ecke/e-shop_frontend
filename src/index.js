import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import App from './pages/App';
import './index.css';
import './styles/legal.css';

const resolveBasename = () => {
  const raw = process.env.REACT_APP_BASENAME || process.env.PUBLIC_URL || '';
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) {
    try {
      const path = new URL(raw).pathname.replace(/\/$/, '');
      return path === '/' ? '' : path;
    } catch (err) {
      return '';
    }
  }
  const normalized = raw.replace(/\/$/, '');
  return normalized === '/' ? '' : normalized;
};

const basename = resolveBasename();

// Create React root and mount the application. Wrapping the app with
// BrowserRouter enables client‑side routing throughout the site.
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
