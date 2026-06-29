import '@testing-library/jest-dom/vitest'

// jsdom locks `window.location` properties so `vi.spyOn(window.location, 'reload')`
// throws "Cannot redefine property". Replacing `window.location` with a plain
// object whose properties are configurable allows tests to spy on `reload`.
if (typeof window !== 'undefined') {
  const original = window.location
  const replacement: Record<string, unknown> = {}
  for (const key of [
    'href',
    'origin',
    'protocol',
    'host',
    'hostname',
    'port',
    'pathname',
    'search',
    'hash',
    'ancestorOrigins',
  ] as const) {
    replacement[key] = (original as unknown as Record<string, unknown>)[key]
  }
  replacement.assign = (): void => {}
  replacement.replace = (): void => {}
  replacement.reload = (): void => {}
  replacement.toString = (): string => String(original.href)

  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: replacement,
  })
}
