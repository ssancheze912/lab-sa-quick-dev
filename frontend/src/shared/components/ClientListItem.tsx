import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente: Cliente
  isSelected?: boolean
  onClick?: () => void
}

export function ClientListItem({ cliente, isSelected = false, onClick }: ClientListItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <div
      data-testid="cliente-item"
      role="button"
      tabIndex={0}
      aria-label={`Cliente: ${cliente.nombre}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`px-4 py-3 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors ${
        isSelected
          ? 'bg-blue-50 border-l-4 border-l-[#0e79fd]'
          : 'hover:bg-slate-50'
      }`}
    >
      <p className="font-bold text-slate-800 text-sm truncate">{cliente.nombre}</p>
      <p className="text-slate-500 text-xs mt-0.5 truncate">{cliente.nit}</p>
    </div>
  )
}
