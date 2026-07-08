import { useEffect, useState } from 'react'

/**
 * Returns a value that trails `value` by `delay` milliseconds (Story 2.1).
 * Default 150 ms matches the UX spec §Search & Filtering Patterns.
 */
export function useDebouncedValue<T>(value: T, delay = 150): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])

  return debounced
}
