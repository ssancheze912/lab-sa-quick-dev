import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente: Cliente
  isSelected?: boolean
  onClick?: () => void
}

export function ClientListItem({ cliente, isSelected, onClick }: ClientListItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="px-4 py-3 cursor-pointer border-l-2 hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
      style={{
        borderLeftColor: isSelected ? '#0e79fd' : 'transparent',
        backgroundColor: isSelected ? '#eff6ff' : undefined,
      }}
      aria-pressed={isSelected}
    >
      <p className="text-sm font-bold text-slate-800 truncate">{cliente.nombre}</p>
      <p className="text-xs text-slate-500 truncate">{cliente.nit}</p>
    </div>
  )
}
