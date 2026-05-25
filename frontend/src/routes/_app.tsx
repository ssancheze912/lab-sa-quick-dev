/**
 * Pathless layout route — App content area
 * Story 1.2: Frontend Navigation Shell
 *
 * This is a pathless layout (no URL segment) that wraps the main app content.
 * Routes nested under _app/ will render inside this layout.
 */
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="h-full">
      <Outlet />
    </div>
  )
}
