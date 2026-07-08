/**
 * Domain type for a Cliente (Story 2.1).
 *
 * Timestamps stay as ISO-8601 strings — the presentation layer only formats
 * them when a story actually renders a date. Story 2.1 does not.
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
