import { createFileRoute } from '@tanstack/react-router'
import { ClientesPlaceholderView } from '@/modules/crm/clientes/presentation/ClientesPlaceholderView'

export const Route = createFileRoute('/clientes')({
  component: ClientesPlaceholderView,
})
