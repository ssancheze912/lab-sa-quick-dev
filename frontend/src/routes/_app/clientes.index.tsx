import { createFileRoute } from '@tanstack/react-router'
import { ClienteDetailPlaceholder } from '../../shared/components/ClienteDetailPlaceholder'

export const Route = createFileRoute('/_app/clientes/')({
  component: ClienteDetailPlaceholder,
})
