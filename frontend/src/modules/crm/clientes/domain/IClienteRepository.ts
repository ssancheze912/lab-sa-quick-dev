// Story 2.1: Client List & Search
// Repository interface for Cliente domain

import type { Cliente } from './Cliente'

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
}
