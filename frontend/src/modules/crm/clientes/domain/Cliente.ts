/**
 * Public read model of a cliente as returned by GET /api/v1/clientes.
 * Timestamps use ISO 8601 strings — the backend serializes DateTimeOffset.
 */
export interface Cliente {
  readonly id: string
  readonly nombre: string
  readonly nit: string
  readonly telefono: string
  readonly ciudad: string
  readonly createdAt: string
  readonly updatedAt: string
}
