/**
 * Story 2.1 — Client List & Search.
 *
 * Mirrors the backend `ClienteDto` contract. Dates arrive as ISO 8601 strings
 * (JSON serialization of `DateTimeOffset`).
 */
export interface Cliente {
  id: string
  nombre: string
  nitRuc: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}
