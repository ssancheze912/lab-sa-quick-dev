import type { Cliente, CreateClienteRequest, UpdateClienteRequest } from './Cliente'

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente>
  create(data: CreateClienteRequest): Promise<Cliente>
  update(id: string, data: UpdateClienteRequest): Promise<Cliente>
}
