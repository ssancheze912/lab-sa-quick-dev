import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

interface ClienteListItemProps {
  cliente: Cliente
  isSelected: boolean
  onClick: () => void
}

export function ClienteListItem({ cliente, isSelected, onClick }: ClienteListItemProps) {
  return (
    <div
      data-testid="cliente-list-item"
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={cliente.nombre}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={`flex flex-col px-4 py-3 cursor-pointer min-h-[44px] hover:bg-slate-50 border-l-4 transition-colors ${
        isSelected
          ? 'bg-blue-50 border-[#0e79fd]'
          : 'border-transparent'
      }`}
    >
      <span className="text-sm font-medium text-slate-900 truncate">{cliente.nombre}</span>
      <span className="text-xs text-slate-500 truncate">{cliente.nitRuc}</span>
    </div>
  )
}
