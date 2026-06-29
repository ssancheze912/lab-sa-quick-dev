export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string // ISO 8601 with TZ
  updatedAt?: string // ISO 8601 with TZ — present after PUT
  contactCount?: number // number of associated contacts — present if backend provides it
}
