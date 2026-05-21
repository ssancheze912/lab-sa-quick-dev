import type { Cliente } from './Cliente'
import type { ClienteFormValues } from '../application/clienteSchema'

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente>
  create(data: ClienteFormValues): Promise<Cliente>
}
