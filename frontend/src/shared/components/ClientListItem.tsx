import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente: Cliente
  isSelected?: boolean
  onSelect?: (id: string) => void
}

/**
 * Presentational row for the client list. Story 2.1 renders it as a
 * `<button>` and only tracks selection locally — the deep-link
 * `<Link to="/clientes/$clienteId">` migration happens in Story 2.2 once the
 * child route file exists (`_app/clientes.$clienteId.tsx`).
 */
export function ClientListItem({
  cliente,
  isSelected = false,
  onSelect,
}: ClientListItemProps) {
  return (
    <li data-testid="cliente-list-item" className="border-b border-slate-100">
      <button
        type="button"
        onClick={() => onSelect?.(cliente.id)}
        className={[
          'block w-full text-left px-3 py-2 min-h-[44px]',
          'hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-primary,#0e79fd]',
          isSelected ? 'bg-slate-100 font-semibold' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <p className="text-sm text-slate-900 truncate">{cliente.nombre}</p>
        <p className="text-xs text-slate-500 truncate">NIT/RUC: {cliente.nitRuc}</p>
      </button>
    </li>
  )
}
