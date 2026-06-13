import { createFileRoute } from '@tanstack/react-router'
import { NotFoundPage } from '../shared/components/NotFoundPage'

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
})
