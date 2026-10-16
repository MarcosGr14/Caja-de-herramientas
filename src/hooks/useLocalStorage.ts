import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Store initialValue in a ref so inline arrays/objects never cause effect re-runs
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  // Read value from localStorage or fallback to initialValue
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValueRef.current;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValueRef.current;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  }, [key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (typeof window === 'undefined') {
        console.warn(`Tried setting localStorage key "${key}" even though window is not defined`);
        return;
      }

      try {
        setStoredValue((current) => {
          const newValue = value instanceof Function ? value(current) : value;
          try {
            window.localStorage.setItem(key, JSON.stringify(newValue));
          } catch (storageError) {
            console.warn(`Error writing to localStorage for key "${key}":`, storageError);
          }
          return newValue;
        });

        // Dispatch a custom event with the specific key so only listeners for this key react
        window.dispatchEvent(
          new CustomEvent('local-storage-sync', { detail: { key } })
        );
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  useEffect(() => {

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key || e.key === null) {
        const fresh = readValue();
        setStoredValue((prev) => {
          try {
            if (JSON.stringify(prev) === JSON.stringify(fresh)) return prev;
          } catch {
            if (prev === fresh) return prev;
          }
          return fresh;
        });
      }
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>;
      if (!customEvent.detail || customEvent.detail.key === key) {
        const fresh = readValue();
        setStoredValue((prev) => {
          try {
            if (JSON.stringify(prev) === JSON.stringify(fresh)) return prev;
          } catch {
            if (prev === fresh) return prev;
          }
          return fresh;
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-sync', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-sync', handleCustomChange);
    };
  }, [key, readValue]);

  return [storedValue, setValue];
}
