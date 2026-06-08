import { useEffect, useState } from 'react'

/**
 * Returns a debounced copy of `value` that only updates after `delayMs` has
 * elapsed without further changes. Used by the search input (AC #5) to keep
 * the visible text instant while the filter recomputes at most every 150 ms.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}
