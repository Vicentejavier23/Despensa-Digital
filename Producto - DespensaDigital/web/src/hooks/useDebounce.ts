import { useState, useEffect } from 'react';

/**
 * Retrasa la actualización de un valor hasta que el usuario deje de escribir.
 * @param value  — valor a debouncear
 * @param delay  — milisegundos de espera (default: 350)
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
