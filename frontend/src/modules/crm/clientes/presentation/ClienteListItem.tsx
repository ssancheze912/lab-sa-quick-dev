import type { Cliente } from '../domain/Cliente'

interface ClienteListItemProps {
  cliente: Cliente
  selected?: boolean
  onSelect: (id: string) => void
}

/**
 * List row for a client — Story 2.1 AC #1.
 *
 * Displays two lines: nombre (bold) + NIT (subtle). Selected state visualises
 * a 3px primary-600 left border + primary-50 background, per UX spec.
 * Contact-count badge and "sin contactos" marker are out-of-scope for this
 * story (they live in Epic 4).
 */
export function ClienteListItem({ cliente, selected = false, onSelect }: ClienteListItemProps) {
  return (
    <button
      type="button"
      data-testid={`cliente-list-item-${cliente.id}`}
      aria-label={`Ver cliente: ${cliente.nombre}`}
      onClick={() => onSelect(cliente.id)}
      className={[
        'w-full border-l-[3px] px-4 py-3 text-left transition-colors',
        selected
          ? 'border-blue-600 bg-blue-50'
          : 'border-transparent hover:bg-slate-50',
      ].join(' ')}
    >
      <span className="block truncate text-sm font-medium text-slate-900">
        {cliente.nombre}
      </span>
      <span className="mt-0.5 block truncate text-xs text-slate-500">{cliente.nit}</span>
    </button>
  )
}
