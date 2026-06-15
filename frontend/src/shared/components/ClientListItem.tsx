import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente: Cliente
  isSelected?: boolean
  onClick?: (id: string) => void
}

/**
 * List item for the clientes panel. Two stacked lines: nombre (font-medium)
 * + nit (text-sm text-slate-500). Marked active via `data-active`.
 */
export function ClientListItem({
  cliente,
  isSelected = false,
  onClick,
}: ClientListItemProps) {
  return (
    <button
      type="button"
      data-testid="cliente-list-item"
      data-active={isSelected ? 'true' : 'false'}
      onClick={() => onClick?.(cliente.id)}
      className="flex w-full flex-col items-start gap-0.5 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:bg-slate-100 data-[active=true]:bg-blue-50"
    >
      <span className="font-medium text-slate-900">{cliente.nombre}</span>
      <span className="text-sm text-slate-500">{cliente.nit}</span>
    </button>
  )
}
