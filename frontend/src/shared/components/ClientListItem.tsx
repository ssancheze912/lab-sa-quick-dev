import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

export interface ClientListItemProps {
  cliente: Cliente
  isSelected: boolean
  onClick: () => void
}

/**
 * Keyboard-accessible list item rendering a single Cliente (Story 2.1).
 * Lives in `shared/components/` per architecture line 502 — it is reused by
 * any future view that needs a list of clientes (Story 2.6 sort, Story 4.x).
 *
 * Min-height 56 px satisfies the 44 px WCAG touch-target rule.
 */
export function ClientListItem({ cliente, isSelected, onClick }: ClientListItemProps) {
  const ariaLabel = `${cliente.nombre} — NIT ${cliente.nit}`
  const baseClasses =
    'flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors ' +
    'min-h-[56px] focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none'
  const stateClasses = isSelected
    ? 'bg-primary-50 border-l-2 border-l-primary-600'
    : 'border-l-2 border-l-transparent hover:bg-slate-50'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      {...(isSelected ? { 'aria-current': 'true' as const } : {})}
      className={`${baseClasses} ${stateClasses}`}
    >
      <span className="text-sm font-semibold text-slate-900">{cliente.nombre}</span>
      <span className="text-xs text-slate-500">{cliente.nit}</span>
    </button>
  )
}
