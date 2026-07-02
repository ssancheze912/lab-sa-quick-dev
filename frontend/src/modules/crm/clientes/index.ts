export { ClienteListView } from './presentation/ClienteListView'
export { ClienteDetailView } from './presentation/ClienteDetailView'
export { ClientListItem } from './presentation/ClientListItem'
export { ClienteFormModal } from './presentation/ClienteFormModal'
export { useClientes } from './application/useClientes'
export { useCliente } from './application/useCliente'
export { useCreateCliente } from './application/useCreateCliente'
export { useUpdateCliente } from './application/useUpdateCliente'
export type { Cliente } from './domain/Cliente'
export type {
  IClienteRepository,
  CreateClientePayload,
  UpdateClientePayload,
} from './domain/IClienteRepository'
