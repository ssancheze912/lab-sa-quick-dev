import type { Contacto } from '../domain/Contacto'

export function filterOrphanContactos(contacts: Contacto[]): Contacto[] {
  return contacts.filter((c) => c.clienteId === null)
}
