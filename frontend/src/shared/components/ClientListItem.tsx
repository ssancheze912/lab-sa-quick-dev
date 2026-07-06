import { Link } from '@tanstack/react-router'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente: Cliente
}

export function ClientListItem({ cliente }: ClientListItemProps) {
  return (
    <Link
      to="/clientes/$clienteId"
      params={{ clienteId: cliente.id }}
      data-testid="cliente-list-item"
      className="block cursor-pointer rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <p className="text-sm font-medium text-slate-900 dark:text-white">{cliente.nombre}</p>
      <p className="text-xs text-slate-500">{cliente.nit}</p>
    </Link>
  )
}
