import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

interface ClienteListItemProps {
  cliente: Cliente
  isSelected: boolean
  onClick: () => void
}

export function ClienteListItem({ cliente, isSelected, onClick }: ClienteListItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      data-testid="cliente-list-item"
      role="button"
      tabIndex={0}
      aria-label={`Cliente ${cliente.nombre}, NIT ${cliente.nit}`}
      aria-pressed={isSelected}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`cursor-pointer border-l-4 px-3 py-2 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0e79fd] ${
        isSelected
          ? 'border-[#0e79fd] bg-blue-50'
          : 'border-transparent'
      }`}
    >
      <p className="text-sm font-bold text-slate-800 truncate">{cliente.nombre}</p>
      <p className="text-xs text-slate-500 truncate">{cliente.nit}</p>
    </div>
  )
}
