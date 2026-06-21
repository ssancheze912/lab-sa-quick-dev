import { createFileRoute } from '@tanstack/react-router'
import { ClientesPlaceholder } from '@/modules/crm/clientes/presentation/ClientesPlaceholder'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPlaceholder,
})
