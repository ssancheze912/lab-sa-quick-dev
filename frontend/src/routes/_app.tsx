import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from './-app-layout'

export { AppLayout }

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})
