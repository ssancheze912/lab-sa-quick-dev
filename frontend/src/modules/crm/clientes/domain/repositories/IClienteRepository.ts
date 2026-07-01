import type { Cliente } from '@/modules/crm/clientes/domain/entities/Cliente'

export interface IClienteRepository {
  getAll(searchTerm?: string): Promise<Cliente[]>
  getById(id: string): Promise<Cliente>
  create(data: { nombre: string; nit: string; telefono: string; ciudad: string }): Promise<Cliente>
  update(id: string, data: { nombre: string; nit: string; telefono: string; ciudad: string }): Promise<Cliente>
  remove(id: string): Promise<{ hadAssociatedContacts: boolean }>
}
