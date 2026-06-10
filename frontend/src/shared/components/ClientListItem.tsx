import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente: Cliente
  isSelected?: boolean
  onClick: () => void
}

export function ClientListItem({ cliente, isSelected = false, onClick }: ClientListItemProps): JSX.Element {
  return (
    <button
      type="button"
      data-testid="client-list-item"
      aria-selected={isSelected}
      onClick={onClick}
      className={[
        'w-full text-left px-4 py-3 border-b border-slate-100 transition-colors',
        isSelected
          ? 'bg-blue-50 text-blue-700'
          : 'bg-white text-slate-900 hover:bg-slate-50',
      ].join(' ')}
    >
      <p className="text-sm font-medium truncate">{cliente.nombre}</p>
      <p className="text-xs text-slate-500 truncate">{cliente.nit}</p>
    </button>
  )
}
