import { memo } from 'react'
import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente: Cliente
  isSelected: boolean
  onClick: () => void
}

export const ClientListItem = memo(function ClientListItem({ cliente, isSelected, onClick }: ClientListItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={cliente.nombre}
      data-testid="cliente-list-item"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={`px-4 py-3 border-b border-slate-100 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border-l-4 border-l-blue-600'
          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
      }`}
    >
      <p className="text-sm font-medium text-slate-800 truncate">{cliente.nombre}</p>
      <p className="text-xs text-slate-500 truncate">{cliente.nit}</p>
    </div>
  )
})
