import { createFileRoute } from '@tanstack/react-router'
import { NotFoundView } from '../shared/components/ui/NotFoundView'

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
})

function NotFoundPage() {
  return <NotFoundView />
}
