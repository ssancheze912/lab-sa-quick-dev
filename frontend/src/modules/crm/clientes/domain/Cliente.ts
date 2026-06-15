/**
 * Domain type for a cliente, mirrors the shape returned by
 * `GET /api/v1/clientes`. Timestamps arrive as ISO 8601 strings.
 */
export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string | null
  ciudad: string | null
  createdAt: string
  updatedAt: string
}
