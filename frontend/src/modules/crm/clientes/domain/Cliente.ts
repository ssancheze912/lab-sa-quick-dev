// Story 2.1: Client List & Search
// Domain entity interface for Cliente

export interface Cliente {
  id: string // UUID
  nombre: string
  nitRuc: string
  telefono: string
  ciudad: string
  createdAt: string // ISO 8601 DateTimeOffset string
}
