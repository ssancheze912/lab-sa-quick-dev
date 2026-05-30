import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

interface ClientListItemProps {
  cliente?: Cliente
  id?: string
  nombre: string
  nit: string
  isActive?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export function ClientListItem({ cliente, id, nombre, nit, isActive, isSelected, onClick }: ClientListItemProps) {
  const clienteId = id ?? cliente?.id ?? ''
  const active = isActive ?? isSelected ?? false

  return (
    <div
      data-testid={`cliente-list-item-${clienteId}`}
      role="button"
      aria-current={active ? 'page' : undefined}
      aria-label={`Cliente ${nombre}`}
      onClick={onClick}
      className={[
        'flex flex-col px-3 py-2 rounded-lg cursor-pointer transition-colors min-h-[44px] justify-center focus:outline-none focus:ring-2 focus:ring-[#0e79fd]',
        active ? 'bg-blue-50 text-[#0e79fd]' : 'hover:bg-slate-50',
      ].join(' ')}
    >
      <span className={['text-sm font-bold truncate', active ? 'text-[#0e79fd]' : 'text-slate-800'].join(' ')}>
        {nombre}
      </span>
      <span className="text-xs text-slate-500 truncate">{nit}</span>
    </div>
  )
}
