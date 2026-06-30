export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

export interface CreateClienteRequest {
  nombre: string
  nit: string
  telefono: string
  ciudad: string
}

export interface UpdateClienteRequest {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
}
