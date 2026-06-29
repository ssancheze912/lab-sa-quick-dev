import type { Cliente } from './Cliente'
import type { ClienteFormData } from '../application/clienteSchema'

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente>
  create(data: ClienteFormData): Promise<Cliente>
}
