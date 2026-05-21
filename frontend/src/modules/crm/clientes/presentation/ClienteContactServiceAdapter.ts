import { apiClient } from '../../../../shared/lib/apiClient'
import type { IContactServiceAdapter, LookupConfig, Contact } from 'siesa-ui-kit'
import type { Contacto } from '../../contactos/domain/Contacto'

/**
 * Adapter that wires the ContactManager (siesa-ui-kit) to the backend API
 * filtered by a specific clienteId.
 *
 * Story 4.1 scope: read-only (getByRecordId). save() is a no-op until Story 4.2.
 */
export class ClienteContactServiceAdapter implements IContactServiceAdapter {
  lookupConfig: LookupConfig

  constructor(private readonly clienteId: string) {
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
   * Used by the unit test (UNIT-AC-01) and internally by getByRecordId.
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
   * No-op for Story 4.1 (read-only). Implemented in Story 4.2.
   */
  async save(_recordId: string, _contacts: Contact[]): Promise<void> {
    // Story 4.2 will implement full save logic
  }
}
