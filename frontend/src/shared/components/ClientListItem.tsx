import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente: Cliente
  isSelected: boolean
  onClick: () => void
}

export function ClientListItem({ cliente, isSelected, onClick }: ClientListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="cliente-list-item"
      className={[
        'w-full rounded-md px-3 py-3 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]',
        isSelected
          ? 'bg-primary-50 text-primary-700'
          : 'hover:bg-slate-100 text-slate-800',
      ].join(' ')}
    >
      <p className="text-sm font-bold truncate">{cliente.nombre}</p>
      <p className="text-xs text-slate-500 truncate">{cliente.nit}</p>
    </button>
  )
}
