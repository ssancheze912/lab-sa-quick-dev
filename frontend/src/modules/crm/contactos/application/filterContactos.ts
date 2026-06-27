import type { Contacto } from '../domain/Contacto'

export function filterContactos(contacts: Contacto[], query: string): Contacto[] {
  if (!query.trim()) return contacts
  const lower = query.toLowerCase()
  return contacts.filter(
    (c) =>
      c.nombre.toLowerCase().includes(lower) ||
      c.email.toLowerCase().includes(lower),
  )
}
