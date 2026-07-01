import type { Cliente } from '@/modules/crm/clientes/domain/entities/Cliente'

export interface IClienteRepository {
  getAll(searchTerm?: string): Promise<Cliente[]>
}
