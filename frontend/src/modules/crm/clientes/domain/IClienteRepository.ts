import type { Cliente, CreateClienteRequest } from './Cliente'

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente>
  create(data: CreateClienteRequest): Promise<Cliente>
}
