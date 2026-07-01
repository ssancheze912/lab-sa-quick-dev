import type { Contacto } from '@/modules/crm/contactos/domain/entities/Contacto'

interface ContactListItemProps {
  contacto: Contacto
  selected?: boolean
  onClick?: (contacto: Contacto) => void
}

export function ContactListItem({ contacto, selected = false, onClick }: ContactListItemProps) {
  return (
    <li
      data-testid="contacto-list-item"
      onClick={() => onClick?.(contacto)}
      aria-selected={selected}
      className={`cursor-pointer rounded-md p-3 hover:bg-slate-100 ${selected ? 'bg-primary-50' : ''}`}
    >
      <p className="text-sm font-medium text-slate-900">{contacto.nombre}</p>
      <p className="text-xs text-slate-600">{contacto.cargo}</p>
      <p className="text-xs text-slate-600">{contacto.email}</p>
    </li>
  )
}
