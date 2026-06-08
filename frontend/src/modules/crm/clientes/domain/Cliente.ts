/**
 * Story 2.1: Client List & Search
 *
 * Domain entity for a single client record. Mirrors the backend `ClienteDto`
 * exactly (camelCase keys, ISO 8601 timestamps with UTC offset, UUID id).
 */
export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}
