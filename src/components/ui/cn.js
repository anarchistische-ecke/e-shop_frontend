export function cn(...values) {
  const classes = [];

  const visit = (value) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (typeof value === 'object') {
      Object.entries(value).forEach(([key, enabled]) => {
        if (enabled) {
          classes.push(key);
        }
      });
      return;
    }

    if (typeof value === 'string') {
      classes.push(value);
    }
  };

  values.forEach(visit);
  return classes.join(' ');
}
