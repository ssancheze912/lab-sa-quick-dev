import type { Cliente, CreateClientePayload } from './Cliente'

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente>
  create(data: CreateClientePayload): Promise<Cliente>
}
