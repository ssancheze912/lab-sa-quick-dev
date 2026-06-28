import { contactoApiRepository } from '../../contactos/infrastructure/contactoApiRepository';
import type { Contacto } from '../../contactos/domain/Contacto';

/**
 * ClienteContactServiceAdapter bridges the ContactManager component to the REST API
 * via the contactoApiRepository. Implements a service adapter pattern for Epic 4.
 *
 * Note: siesa-ui-kit is not available in this environment. This adapter is used
 * by the custom ContactManager component instead.
 *
 * Story 4.2 will add mutation methods (addContact, removeContact).
 */
export class ClienteContactServiceAdapter {
  private readonly clienteId: string;

  constructor(clienteId: string) {
    this.clienteId = clienteId;
  }

  async getContacts(): Promise<Contacto[]> {
    return contactoApiRepository.getByClienteId(this.clienteId);
  }

  async addContact(): Promise<never> {
    throw new Error('Not implemented — Story 4.2');
  }

  async removeContact(): Promise<never> {
    throw new Error('Not implemented — Story 4.2');
  }
}
