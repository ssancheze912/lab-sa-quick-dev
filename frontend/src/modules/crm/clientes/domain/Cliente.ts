export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

export interface CreateClientePayload {
  nombre: string
  nit: string
  telefono: string
  ciudad: string
}
