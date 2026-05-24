// Story 2.1: Client List & Search
// Shared component: ClienteListItem

import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

interface ClienteListItemProps {
  cliente: Cliente
  isActive: boolean
  onClick: (id: string) => void
}

export function ClienteListItem({ cliente, isActive, onClick }: ClienteListItemProps) {
  return (
    <button
      data-testid="cliente-list-item"
      role="listitem"
      onClick={() => onClick(cliente.id)}
      aria-label={`Seleccionar cliente ${cliente.nombre}`}
      className={[
        'w-full text-left px-4 py-3 flex flex-col gap-0.5 hover:bg-slate-50 transition-colors',
        isActive ? 'bg-[#0e79fd]/10 border-l-2 border-[#0e79fd]' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="text-sm font-medium text-slate-800">{cliente.nombre}</span>
      <span className="text-xs text-slate-500">{cliente.nitRuc}</span>
    </button>
  )
}
