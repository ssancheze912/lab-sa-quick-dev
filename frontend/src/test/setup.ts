import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'

/**
 * jsdom does not implement `window.matchMedia`. Provide a default desktop-mode
 * (≥ lg 1024px) shim so components that read Tailwind media queries do not crash.
 * Individual tests may override this with narrower viewports.
 */
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => {
      const minWidthMatch = /\(min-width:\s*(\d+)px\)/.exec(query)
      const width =
        typeof window.innerWidth === 'number' ? window.innerWidth : 1280
      const matches = minWidthMatch
        ? width >= Number(minWidthMatch[1])
        : false
      return {
        matches,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      } as MediaQueryList
    },
  })
}

/**
 * jsdom's `window.location` has non-configurable properties (`reload`, `href`,
 * etc.), which prevents `vi.spyOn(window.location, 'reload')` from working.
 * Replace it with a plain object whose properties are configurable — this
 * preserves the API surface tests rely on while allowing spies.
 */
if (typeof window !== 'undefined') {
  const originalLocation = window.location
  const mockLocation = {
    ancestorOrigins: originalLocation.ancestorOrigins,
    hash: '',
    host: 'localhost',
    hostname: 'localhost',
    href: 'http://localhost/',
    origin: 'http://localhost',
    pathname: '/',
    port: '',
    protocol: 'http:',
    search: '',
    assign: () => {},
    reload: () => {},
    replace: () => {},
    toString: () => 'http://localhost/',
  }
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: mockLocation,
  })
}

/**
 * jsdom does not implement `window.scrollTo`. Provide a no-op so components
 * (e.g. TanStack Router's default scroll restoration) don't spam the log.
 */
if (typeof window !== 'undefined' && typeof window.scrollTo !== 'function') {
  window.scrollTo = (() => {}) as typeof window.scrollTo
}

/**
 * Patch `screen.findByRole` and `screen.getByRole` to accept RegExp roles.
 * The base RTL v10 role queries only accept string roles, but the ATDD tests
 * pass regexes like `/link|button/`. When a RegExp is passed, we iterate over
 * the common interactive roles that match and merge results (deduplicated).
 */
const CANDIDATE_ROLES = [
  'button',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'tab',
  'checkbox',
  'radio',
  'switch',
  'option',
  'treeitem',
] as const

type Options = Record<string, unknown> | undefined

function collectByRoleRegex(
  regex: RegExp,
  options: Options,
): HTMLElement[] {
  const seen = new Set<HTMLElement>()
  const out: HTMLElement[] = []
  for (const role of CANDIDATE_ROLES) {
    if (!regex.test(role)) continue
    const matches = screen.queryAllByRole(role, options as never)
    for (const el of matches) {
      if (!seen.has(el)) {
        seen.add(el)
        out.push(el)
      }
    }
  }
  return out
}

const nativeFindByRole = screen.findByRole
;(screen as unknown as {
  findByRole: (role: string | RegExp, options?: Options) => Promise<HTMLElement>
}).findByRole = async (role, options) => {
  if (!(role instanceof RegExp)) {
    return nativeFindByRole.call(screen, role as never, options as never)
  }
  const timeout = 1000
  const interval = 20
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const results = collectByRoleRegex(role, options)
    if (results.length > 0) return results[0]
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
  throw new Error(`Unable to find element matching role /${role.source}/`)
}

const nativeGetByRole = screen.getByRole
;(screen as unknown as {
  getByRole: (role: string | RegExp, options?: Options) => HTMLElement
}).getByRole = (role, options) => {
  if (!(role instanceof RegExp)) {
    return nativeGetByRole.call(screen, role as never, options as never)
  }
  const results = collectByRoleRegex(role, options)
  if (results.length === 0) {
    throw new Error(`Unable to find element matching role /${role.source}/`)
  }
  return results[0]
}
