import '@testing-library/jest-dom'

// Importing the generated route tree wires the IDs and parent links on the
// file-route singletons (Route exports from src/routes/*.tsx). Tests that
// import `Route` directly from those modules need this side effect so that
// `createFileRoute('/_app')` etc. is fully initialized.
import '@/routeTree.gen'

// jsdom's `window.location` is non-configurable for some properties (e.g.
// `reload`). Replace `window.location` with a mutable object so tests can
// spy on `reload` via `Object.defineProperty(window.location, 'reload', ...)`.
if (typeof window !== 'undefined' && window.location) {
  const originalLocation = window.location
  const mutableLocation: Location = {
    ...originalLocation,
    ancestorOrigins: originalLocation.ancestorOrigins,
    hash: originalLocation.hash,
    host: originalLocation.host,
    hostname: originalLocation.hostname,
    href: originalLocation.href,
    origin: originalLocation.origin,
    pathname: originalLocation.pathname,
    port: originalLocation.port,
    protocol: originalLocation.protocol,
    search: originalLocation.search,
    assign: originalLocation.assign.bind(originalLocation),
    reload: () => {},
    replace: originalLocation.replace.bind(originalLocation),
    toString: originalLocation.toString.bind(originalLocation),
  }
  try {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: mutableLocation,
    })
  } catch {
    // ignore — environment already permits override
  }
}

// jsdom does not implement `window.scrollTo`. TanStack Router's scroll
// restoration calls it on every navigation, polluting test output. Stub it.
if (typeof window !== 'undefined') {
  window.scrollTo = () => {}
}
