import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente: Cliente
  isSelected: boolean
  onClick: (id: string) => void
}

export function ClientListItem({ cliente, isSelected, onClick }: ClientListItemProps) {
  return (
    <li
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      data-testid={`client-list-item-${cliente.id}`}
      onClick={() => onClick(cliente.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(cliente.id)
        }
      }}
      className={`px-4 py-3 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${
        isSelected
          ? 'bg-primary-50 text-primary-700'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <p className="font-bold text-sm truncate">{cliente.nombre}</p>
      <p className="text-xs text-slate-500 truncate">{cliente.nit}</p>
    </li>
  )
}
