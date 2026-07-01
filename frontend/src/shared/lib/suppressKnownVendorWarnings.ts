/**
 * Filters a small, explicit allowlist of `console.error` messages caused by
 * known third-party bugs we cannot patch (the bug lives inside the vendor's
 * published bundle, in `node_modules`).
 *
 * Specifically: `siesa-ui-kit@1.0.250`'s `Input` component spreads
 * unrecognized props (including `startIcon`/`endIcon`) directly onto the
 * underlying DOM `<input>` element instead of stripping them first. Our own
 * usages of `Input` were fixed to never pass `startIcon`/`endIcon` (see
 * ClienteListView.tsx), but `siesa-ui-kit`'s own internal components (e.g.
 * `NavigationRailGroup`'s module-search box, always mounted in `expanded`
 * rail state — see AppShell.tsx) use `Input` with `startIcon` themselves,
 * which is outside app code's reach.
 *
 * Every other `console.error` call (including real bugs in our own code)
 * passes through unchanged — this only matches the exact known React DOM
 * unknown-prop warning text for `startIcon`/`endIcon`.
 */
const KNOWN_VENDOR_WARNING_PATTERN =
  /does not recognize the `%s` prop on a DOM element/i

export function suppressKnownVendorWarnings(): void {
  const originalConsoleError = console.error

  console.error = (...args: unknown[]) => {
    const [message, prop] = args
    const isKnownStartOrEndIconWarning =
      typeof message === 'string' &&
      KNOWN_VENDOR_WARNING_PATTERN.test(message) &&
      (prop === 'startIcon' || prop === 'endIcon')

    if (isKnownStartOrEndIconWarning) {
      return
    }

    originalConsoleError(...args)
  }
}
