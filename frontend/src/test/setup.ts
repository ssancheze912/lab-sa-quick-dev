import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw/server'
import { resetClienteState } from './msw/handlers'

// MSW lifecycle — wired here so every Vitest suite gets a mocked network by
// default. Individual tests can call `server.use(...)` to override handlers;
// `resetHandlers()` after each test restores the default set.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  // Story 2.3 — the POST handler mutates the seed. Reset the state so tests
  // exercising the create flow do not contaminate the next test's initial list.
  resetClienteState()
})
afterAll(() => server.close())

/**
 * jsdom's `window.location` is a real `Location` instance whose properties
 * (in particular `reload`) are non-configurable. Tests that spy on
 * `window.location.reload` via `Object.defineProperty(window.location, 'reload', ...)`
 * fail with "Cannot redefine property: reload" unless we replace the whole
 * `window.location` with a plain, configurable object first.
 */
if (typeof window !== 'undefined') {
  const url = new URL(window.location.href)
  const locationStub = {
    ancestorOrigins: {} as DOMStringList,
    href: url.href,
    origin: url.origin,
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    assign: () => undefined,
    replace: () => undefined,
    reload: () => undefined,
    toString: () => url.href,
  }
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: locationStub,
  })
}
