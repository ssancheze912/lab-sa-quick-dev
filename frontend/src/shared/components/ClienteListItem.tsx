import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

interface ClienteListItemProps {
  cliente: Cliente
  isSelected: boolean
  onClick: () => void
}

export function ClienteListItem({ cliente, isSelected, onClick }: ClienteListItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onClick()
    }
  }

  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      data-testid="cliente-list-item"
      className={`px-4 py-3 cursor-pointer border-l-4 transition-colors ${
        isSelected
          ? 'bg-blue-50 border-[#0e79fd]'
          : 'border-transparent hover:bg-slate-50'
      }`}
    >
      <p className="text-sm font-semibold text-slate-700 truncate">{cliente.nombre}</p>
      <p className="text-xs text-slate-500 truncate">{cliente.nit}</p>
    </div>
  )
}
