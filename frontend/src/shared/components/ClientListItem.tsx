import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

/**
 * Story 2.1: ClientListItem
 *
 * Renders a single client row inside the 280px left panel.
 * - `nombre` is the primary text, `nit` the secondary text (AC #4).
 * - Rendered as a native `<button>` so it is reachable via Tab + Enter (AC #11).
 * - When active: left border + tinted background per ux-design-specification.md.
 * - When active: `aria-current="page"` exposes selection to AT (AC #10).
 *
 * Navigation lives in the parent — this component just signals clicks via `onClick`.
 */
interface ClientListItemProps {
  cliente: Cliente
  isActive: boolean
  onClick: () => void
}

export function ClientListItem({ cliente, isActive, onClick }: ClientListItemProps) {
  const baseClass =
    'w-full text-left px-3 py-2 border-l-4 transition-colors focus:outline-none focus:bg-slate-100'
  const stateClass = isActive
    ? 'border-l-[#0e79fd] bg-[#eff8ff]'
    : 'border-l-transparent hover:bg-slate-50'

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="client-list-item"
      data-active={isActive}
      aria-label={`Ver cliente: ${cliente.nombre}`}
      {...(isActive ? { 'aria-current': 'page' as const } : {})}
      className={`${baseClass} ${stateClass}`}
    >
      <span className="block text-sm font-medium text-slate-900">{cliente.nombre}</span>
      <span className="block text-xs text-slate-500">{cliente.nit}</span>
    </button>
  )
}
