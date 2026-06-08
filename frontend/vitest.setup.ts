import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { setupServer } from 'msw/node'

/**
 * Shared MSW server for component tests (Story 2.1+). Per-test handlers are
 * registered via `server.use(...)` inside the test, and reset automatically
 * after each test so handlers do not leak between files.
 */
export const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

/**
 * TanStack Router (v1.170) renders its matches inside React.Suspense in
 * jsdom environments. The router's initial `load()` is invoked inside a
 * `useLayoutEffect` and resolves on a microtask, so the first synchronous
 * render returns the Suspense fallback (null) and the body is empty until
 * the microtask flushes. The same applies to `router.navigate(...)`, which
 * commits the new location asynchronously.
 *
 * Several Story 1.2 ATDD tests (AppShell.test.tsx) query synchronously
 * with `screen.getByTestId(...)` immediately after `render(...)` and
 * `fireEvent.click(...)`. To keep those tests synchronous we mock
 * `@tanstack/react-router` so that:
 *   1. `createRouter` pre-populates the match store via `matchRoutes`.
 *   2. `navigate(...)` commits the location and re-populates matches
 *      synchronously before returning.
 *
 * Production code (`main.tsx`) is unaffected — this only runs in Vitest.
 */
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  )

  function syncPopulateMatches(router: unknown): void {
    try {
      const r = router as {
        latestLocation?: unknown
        matchRoutes?: (loc: unknown) => unknown[]
        stores?: { setMatches?: (m: unknown[]) => void }
      }
      if (r.latestLocation && typeof r.matchRoutes === 'function') {
        const matches = r.matchRoutes(r.latestLocation)
        r.stores?.setMatches?.(matches)
      }
    } catch {
      /* swallow — fall back to async load */
    }
  }

  const patchedCreateRouter: typeof actual.createRouter = (...args) => {
    const router = actual.createRouter(...args)
    syncPopulateMatches(router)

    // Wrap navigate so the matches store updates synchronously after the
    // location change. The Transitioner will still run its async path later
    // but the React tree already has the right matches at this point.
    const rMut = router as unknown as {
      navigate?: (...a: unknown[]) => Promise<unknown>
      buildLocation?: (opts: unknown) => { pathname: string }
      commitLocation?: (loc: unknown) => Promise<unknown>
      latestLocation?: { pathname: string }
      history?: { push: (path: string) => void; location: { pathname: string } }
    }
    const originalNavigate = rMut.navigate
    if (typeof originalNavigate === 'function') {
      rMut.navigate = function patchedNavigate(opts: unknown) {
        const result = originalNavigate.call(rMut, opts)
        // Best-effort sync update for the most common navigation opts.
        try {
          const o = opts as { to?: string }
          if (typeof o?.to === 'string' && rMut.history) {
            rMut.history.push(o.to)
            // After history.push, latestLocation may have updated via the
            // subscription. Re-derive matches.
            syncPopulateMatches(rMut)
          }
        } catch {
          /* ignore */
        }
        return result
      } as typeof originalNavigate
    }

    return router
  }

  return {
    ...actual,
    createRouter: patchedCreateRouter,
  }
})
