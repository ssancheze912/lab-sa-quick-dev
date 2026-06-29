import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

export interface ClientListItemProps {
  cliente: Cliente
  isSelected: boolean
  onSelect: (id: string) => void
}

/**
 * Story 2.1 — Single row of the client list panel.
 *
 * Rendered as a native `<button>` (not a `<div>`) so screen readers and
 * keyboard users can activate the row. Selected state is communicated via
 * `aria-current="true"` and the UX-spec visual treatment.
 */
export function ClientListItem({
  cliente,
  isSelected,
  onSelect,
}: ClientListItemProps): React.ReactElement {
  const baseClasses =
    'flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left min-h-[44px] ' +
    'border-b border-slate-200 transition-colors hover:bg-slate-50 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
  const selectedClasses = isSelected
    ? 'bg-primary-50 border-l-[3px] border-l-primary-600'
    : ''

  return (
    <button
      type="button"
      aria-label={`Ver cliente: ${cliente.nombre}`}
      aria-current={isSelected ? 'true' : undefined}
      data-testid={`client-list-item-${cliente.id}`}
      className={`${baseClasses} ${selectedClasses}`.trim()}
      onClick={() => onSelect(cliente.id)}
    >
      <span className="font-medium text-slate-900">{cliente.nombre}</span>
      <span className="text-sm text-muted-foreground">{cliente.nitRuc}</span>
    </button>
  )
}
