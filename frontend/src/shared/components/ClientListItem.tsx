import type { Cliente } from '@/modules/crm/clientes/domain/entities/Cliente'

interface ClientListItemProps {
  cliente: Cliente
  selected?: boolean
  onClick?: (cliente: Cliente) => void
}

export function ClientListItem({ cliente, selected = false, onClick }: ClientListItemProps) {
  return (
    <li
      data-testid="cliente-list-item"
      onClick={() => onClick?.(cliente)}
      aria-selected={selected}
      className={`cursor-pointer rounded-md p-3 hover:bg-slate-100 ${selected ? 'bg-primary-50' : ''}`}
    >
      <p className="text-sm font-medium text-slate-900">{cliente.nombre}</p>
      <p className="text-xs text-slate-600">{cliente.nit}</p>
    </li>
  )
}
