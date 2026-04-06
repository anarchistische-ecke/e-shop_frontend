export function createNotification({ id, type = 'info', title = '', message = '', action = null } = {}) {
  return {
    id,
    type,
    title,
    message,
    action
  };
}

export function getNotificationAppearance(type = 'info') {
  switch (type) {
    case 'error':
      return {
        container: 'border-red-200 bg-red-50 text-red-700',
        button: 'text-red-700 hover:text-red-900 focus-visible:ring-red-300'
      };
    case 'success':
      return {
        container: 'border-green-200 bg-green-50 text-green-700',
        button: 'text-green-700 hover:text-green-900 focus-visible:ring-green-300'
      };
    case 'warning':
      return {
        container: 'border-amber-200 bg-amber-50 text-amber-800',
        button: 'text-amber-800 hover:text-amber-900 focus-visible:ring-amber-300'
      };
    default:
      return {
        container: 'border-primary/20 bg-primary/5 text-ink',
        button: 'text-ink hover:text-primary focus-visible:ring-primary/30'
      };
  }
}
