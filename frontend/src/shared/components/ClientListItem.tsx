import { memo } from 'react'
import { Link } from '@tanstack/react-router'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente: Cliente
}

/**
 * Presentational row for the client list (Story 2.2 — migrated from
 * `<button>+onSelect` to a TanStack Router `<Link>`). Selection state is now
 * URL-driven: `activeProps` swaps in the active classes whenever the current
 * route matches `/clientes/{cliente.id}` — satisfying both the click flow
 * (AC #1) and the deep-link flow (AC #2) with a single line.
 *
 * `React.memo` wrap keeps the search filter fast when the list contains
 * hundreds of items — the parent re-renders on each keystroke, but individual
 * items only re-render when their `cliente` reference actually changes.
 */
function ClientListItemComponent({ cliente }: ClientListItemProps) {
  return (
    <li data-testid="cliente-list-item" className="border-b border-slate-100">
      <Link
        to="/clientes/$clienteId"
        params={{ clienteId: cliente.id }}
        className="block w-full text-left px-3 py-2 min-h-[44px] hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-primary,#0e79fd]"
        activeProps={{ className: 'bg-slate-100 font-semibold' }}
      >
        <p className="text-sm text-slate-900 truncate">{cliente.nombre}</p>
        <p className="text-xs text-slate-500 truncate">NIT/RUC: {cliente.nitRuc}</p>
      </Link>
    </li>
  )
}

export const ClientListItem = memo(ClientListItemComponent)
