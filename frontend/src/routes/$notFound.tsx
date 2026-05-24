import { createFileRoute } from '@tanstack/react-router'
import { NotFoundView } from '../shared/components/NotFoundView'

export const Route = createFileRoute('/$notFound')({
  component: NotFoundView,
})
