import type { Cliente, CreateClientePayload, UpdateClientePayload } from './Cliente'

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente>
  create(data: CreateClientePayload): Promise<Cliente>
  update(id: string, data: UpdateClientePayload): Promise<Cliente>
}
