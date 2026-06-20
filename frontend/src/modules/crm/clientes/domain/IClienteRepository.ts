import type { Cliente, CreateClienteData, UpdateClienteData } from './Cliente'

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente>
  create(data: CreateClienteData): Promise<Cliente>
  update(id: string, data: UpdateClienteData): Promise<Cliente>
}
