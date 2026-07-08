import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

export interface ClienteListItemProps {
  cliente: Cliente
  selected: boolean
  onSelect: (id: string) => void
}

/**
 * Row inside the clientes left panel (Story 2.1).
 * Uses a native <button> so Tab/Enter/Space work by default. The
 * `data-selected` attribute is the stable hook for tests — visual selection
 * styling is driven by the same attribute.
 *
 * The contact-count badge and the ⚠ badge are intentionally NOT rendered in
 * Story 2.1 — they depend on contactos (Epic 3 + Story 4.1).
 */
export function ClienteListItem({ cliente, selected, onSelect }: ClienteListItemProps) {
  return (
    <button
      type="button"
      data-selected={selected ? 'true' : 'false'}
      onClick={() => onSelect(cliente.id)}
      aria-label={`Ver cliente: ${cliente.nombre}`}
      className={
        'flex w-full flex-col items-start gap-0.5 border-l-[3px] px-3 py-2 text-left transition-colors ' +
        'hover:bg-slate-50 ' +
        (selected
          ? 'border-[#0e79fd] bg-[#e6f0ff]'
          : 'border-transparent bg-transparent')
      }
    >
      <span className="text-sm font-medium text-slate-900">{cliente.nombre}</span>
      <span className="text-xs text-slate-500">NIT: {cliente.nit}</span>
    </button>
  )
}
