import '@testing-library/jest-dom'

/**
 * jsdom 29 makes `window.location` non-configurable, so component tests that
 * spy on `location.assign / replace / reload` (TC-E1-P1-01) cannot redefine
 * those properties at test time. Replace the entire `location` object once
 * here with a configurable shim that preserves the navigation API surface
 * the application depends on (href, pathname, etc.) while allowing tests
 * to redefine `assign`, `replace`, and `reload` on demand.
 */
function installConfigurableLocation() {
  const original = window.location
  const url = new URL(original?.href ?? 'http://localhost/')

  const shim: Location & Record<string, unknown> = {
    href: url.href,
    origin: url.origin,
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    ancestorOrigins: original?.ancestorOrigins ?? ({} as DOMStringList),
    assign: () => {},
    replace: () => {},
    reload: () => {},
    toString: () => url.href,
  } as unknown as Location & Record<string, unknown>

  try {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: shim,
    })
  } catch {
    // jsdom may reject; tests requiring location spy will document this.
  }
}

installConfigurableLocation()
