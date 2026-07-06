import type { Cliente, CreateClienteInput } from './Cliente'

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente | null>
  create(data: CreateClienteInput): Promise<Cliente>
}
