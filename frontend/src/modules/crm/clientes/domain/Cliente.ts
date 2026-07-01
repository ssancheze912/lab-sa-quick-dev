/**
 * Domain type — Cliente (client) — Story 2.1.
 *
 * Timestamps stay as ISO-8601 strings at the domain layer. Parsing to Date is
 * deferred to formatters at the presentation layer so the domain remains
 * transport-agnostic.
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
