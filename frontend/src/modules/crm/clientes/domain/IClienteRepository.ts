import type { Cliente, CreateClienteData } from './Cliente'

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente>
  create(data: CreateClienteData): Promise<Cliente>
}
