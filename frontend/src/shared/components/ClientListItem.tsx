import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente: Cliente
  isSelected: boolean
  onClick: () => void
}

export function ClientListItem({ cliente, isSelected, onClick }: ClientListItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left px-4 py-3 flex flex-col gap-0.5 hover:bg-slate-50 focus:outline-none focus:bg-slate-50 transition-colors ${
          isSelected
            ? 'bg-blue-50 border-l-2 border-[#0e79fd]'
            : 'border-l-2 border-transparent'
        }`}
        aria-current={isSelected ? ('page' as const) : undefined}
      >
        <span className="text-sm font-semibold text-slate-800 truncate">
          {cliente.nombre}
        </span>
        <span className="text-xs text-slate-500 truncate">
          {cliente.nit}
        </span>
      </button>
    </li>
  )
}
