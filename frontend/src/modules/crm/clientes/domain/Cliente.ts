export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
}

export type CreateClienteInput = Pick<Cliente, 'nombre' | 'nit' | 'telefono' | 'ciudad'>
