import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { CmsContentProvider } from '../contexts/CmsContentContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { PaymentConfigProvider } from '../contexts/PaymentConfigContext';
import { CatalogueDataProvider } from '../features/product-list/data';
import App from '../pages/App';
import '../styles/cms.css';
import '../index.css';
import '../styles/legal.css';

function StorefrontApp({ initialData = {} }) {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CmsContentProvider initialData={initialData.cms}>
          <PaymentConfigProvider initialConfig={initialData.paymentConfig}>
            <CatalogueDataProvider initialData={initialData.directory}>
              <CartProvider>
                <App />
              </CartProvider>
            </CatalogueDataProvider>
          </PaymentConfigProvider>
        </CmsContentProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default StorefrontApp;
