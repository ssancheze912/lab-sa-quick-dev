import type { QueryClient } from '@tanstack/react-query'
import { toast } from '../../../../shared/lib/toastStore'
import { apiClient } from '../../../../shared/lib/apiClient'
import type { IContactServiceAdapter, LookupConfig, Contact } from 'siesa-ui-kit'
import type { Contacto } from '../../contactos/domain/Contacto'

/**
 * Adapter that wires the ContactManager (siesa-ui-kit) to the backend API
 * filtered by a specific clienteId.
 *
 * Story 4.1 scope: read-only (getByRecordId).
 * Story 4.2 scope: adds assignContacto() and removeContacto() write operations.
 */
export class ClienteContactServiceAdapter implements IContactServiceAdapter {
  lookupConfig: LookupConfig

  constructor(
    private readonly clienteId: string,
    private readonly queryClient: QueryClient,
  ) {
    this.lookupConfig = {
      fetcher: async () => ({ data: [], total: 0 }),
      socialNetworkTypes: {
        entity: 'social-network-types',
        displayFields: ['name'],
      },
      countries: {
        entity: 'countries',
        displayFields: ['name'],
      },
    }
  }

  /**
   * Fetches contacts for this client from the API.
   */
  async getContactos(): Promise<Contacto[]> {
    const response = await apiClient.get(`/api/v1/contactos?clienteId=${this.clienteId}`)
    return response.data
  }

  /**
   * Required by IContactServiceAdapter.
   * Maps the Contacto domain model to the Contact type expected by ContactManager.
   */
  async getByRecordId(_recordId: string): Promise<Contact[]> {
    const contactos = await this.getContactos()
    return contactos.map((c) => ({
      id: c.id,
      recordId: this.clienteId,
      name: c.nombre,
      emails: c.email ? [c.email] : [],
      address: null,
      description: c.cargo || null,
      cityId: null,
      neighborhoodId: null,
      useFor: [],
      phones: [],
      socialNetworks: [],
      isDefault: false,
    }))
  }

  /**
   * Associates an existing contact with this client.
   * Called by ContactManager when user adds an existing contact.
   */
  async assignContacto(contactoId: string): Promise<void> {
    await apiClient.put(`/api/v1/contactos/${contactoId}/cliente`, { clienteId: this.clienteId })
    this.queryClient.invalidateQueries({ queryKey: ['contactos'] })
    this.queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: this.clienteId }] })
    toast.success('Contacto asociado correctamente')
  }

  /**
   * Disassociates a contact from this client (sets clienteId = null).
   * The contact record is NOT deleted.
   */
  async removeContacto(contactoId: string): Promise<void> {
    await apiClient.put(`/api/v1/contactos/${contactoId}/cliente`, { clienteId: null })
    this.queryClient.invalidateQueries({ queryKey: ['contactos'] })
    this.queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: this.clienteId }] })
    toast.success('Contacto desasociado correctamente')
  }

  /**
   * No-op save — ContactManager calls save() for inline edits; association/disassociation
   * are handled via assignContacto/removeContacto.
   */
  async save(_recordId: string, _contacts: Contact[]): Promise<void> {
    // Association and disassociation are handled by assignContacto/removeContacto.
  }
}
