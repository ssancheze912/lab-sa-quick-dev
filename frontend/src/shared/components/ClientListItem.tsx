import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente: Cliente
}

export function ClientListItem({ cliente }: ClientListItemProps) {
  return (
    <div
      data-testid="cliente-list-item"
      className="cursor-pointer rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <p className="text-sm font-medium text-slate-900 dark:text-white">{cliente.nombre}</p>
      <p className="text-xs text-slate-500">{cliente.nit}</p>
    </div>
  )
}
