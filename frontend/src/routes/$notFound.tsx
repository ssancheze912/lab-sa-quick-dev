// This file intentionally kept as a catch for single-segment unknown routes.
// True catch-all 404 handling (multi-segment paths) is done via notFoundComponent
// on the root route in __root.tsx.
import { createFileRoute } from '@tanstack/react-router'
import { NotFoundView } from '../shared/components/NotFoundView'

export const Route = createFileRoute('/$notFound')({
  component: NotFoundView,
})
