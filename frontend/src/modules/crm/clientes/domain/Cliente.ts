export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

export interface CreateClienteData {
  nombre: string
  nit: string
  telefono: string
  ciudad: string
}

export interface UpdateClienteData {
  nombre: string
  nit: string
  telefono: string
  ciudad: string
}
