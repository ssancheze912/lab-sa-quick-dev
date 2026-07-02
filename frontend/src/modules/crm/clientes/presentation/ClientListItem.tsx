import type { KeyboardEvent } from 'react'
import type { Cliente } from '../domain/Cliente'

export interface ClientListItemProps {
  cliente: Cliente
  isSelected?: boolean
  onSelect?: (id: string) => void
}

/**
 * Single row in the 280px list panel. Renders Nombre (line 1) + NIT/RUC
 * (line 2) and exposes a role="button" so both keyboard and pointer users
 * can activate the item. Meets WCAG touch-target guidance (min height 44px).
 */
export function ClientListItem({
  cliente,
  isSelected = false,
  onSelect,
}: ClientListItemProps) {
  const handleActivate = () => {
    onSelect?.(cliente.id)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleActivate()
    }
  }

  const baseClasses =
    'flex min-h-[44px] cursor-pointer flex-col justify-center gap-0.5 border-l-[3px] px-3 py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#0e79fd]'
  const stateClasses = isSelected
    ? 'border-l-[#0e79fd] bg-[#eff8ff]'
    : 'border-l-transparent bg-white hover:bg-slate-50'

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Ver cliente: ${cliente.nombre}`}
      aria-pressed={isSelected}
      data-testid="cliente-list-item"
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={`${baseClasses} ${stateClasses}`}
    >
      <span className="truncate text-sm font-semibold text-slate-900">
        {cliente.nombre}
      </span>
      <span className="truncate text-xs text-slate-500">{cliente.nit}</span>
    </div>
  )
}
