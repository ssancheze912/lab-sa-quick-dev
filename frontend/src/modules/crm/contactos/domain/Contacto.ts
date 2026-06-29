export interface Contacto {
  id: string
  nombre: string
  cargo: string
  telefono: string
  email: string
  clienteId: string | null
  createdAt: string // ISO 8601 with TZ
  updatedAt: string // ISO 8601 with TZ
}
