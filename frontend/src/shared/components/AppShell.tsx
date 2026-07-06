import type { ReactNode } from 'react'
import { AppNavigation } from '@/shared/components/AppNavigation'

/**
 * Shared shell layout (nav + content area).
 * Reused by both the `_app` pathless layout route and the root route's
 * `notFoundComponent` — the latter needs it because TanStack Router's fuzzy
 * not-found resolution bubbles fully-unmatched paths straight to the root
 * route (there is no partial path match into `_app`'s branch), so the shell
 * must be rendered explicitly there too to keep navigation visible (AC5).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <AppNavigation />
      <main className="flex-1">{children}</main>
    </div>
  )
}
