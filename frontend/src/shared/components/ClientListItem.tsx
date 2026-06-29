import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente: Cliente
  onClick?: () => void
}

export function ClientListItem({ cliente, onClick }: ClientListItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() }}
      aria-label={`Cliente: ${cliente.nombre}, NIT: ${cliente.nit}`}
      className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
    >
      <p className="font-bold text-slate-800 text-sm truncate">{cliente.nombre}</p>
      <p className="text-slate-500 text-xs truncate">{cliente.nit}</p>
    </div>
  )
}
