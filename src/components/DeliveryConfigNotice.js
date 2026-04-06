import { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { getDeliveryClientConfig, getDeliveryConfigWarning } from '../utils/deliveryConfig';

const DELIVERY_CONFIG_WARNING_ID = 'delivery-client-config-warning';

function DeliveryConfigNotice() {
  const { notify } = useNotifications();
  const { isAuthenticated, hasRole } = useAuth();
  const adminRole = process.env.REACT_APP_KEYCLOAK_ADMIN_ROLE || 'admin';
  const managerRole = process.env.REACT_APP_KEYCLOAK_MANAGER_ROLE || 'manager';
  const config = getDeliveryClientConfig();
  const warning = getDeliveryConfigWarning(config);
  const isDevAudience = process.env.NODE_ENV !== 'production';
  const isPrivilegedUser =
    isAuthenticated && (hasRole(adminRole) || hasRole(managerRole));

  useEffect(() => {
    if (!warning || (!isDevAudience && !isPrivilegedUser)) {
      return;
    }
    notify({
      id: DELIVERY_CONFIG_WARNING_ID,
      type: 'warning',
      title: warning.title,
      message: warning.message,
      duration: 0
    });
  }, [isDevAudience, isPrivilegedUser, notify, warning]);

  return null;
}

export default DeliveryConfigNotice;
