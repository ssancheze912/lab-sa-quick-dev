import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Edge Case Tests — Story 4.1: ClienteContactServiceAdapter
 *
 * Expands ATDD baseline (ClienteContactServiceAdapter.test.ts) with:
 *   - UNIT-EDGE-01 [P1] getByRecordId() maps Contacto domain model to Contact contract correctly
 *   - UNIT-EDGE-02 [P1] getByRecordId() maps a contact with null cargo to description: null
 *   - UNIT-EDGE-03 [P1] getByRecordId() maps a contact with null email to emails: []
 *   - UNIT-EDGE-04 [P1] save() is a no-op (Story 4.1 scope — does not call apiClient)
 *   - UNIT-EDGE-05 [P2] lookupConfig is initialized on construction (not undefined)
 *   - UNIT-EDGE-06 [P2] getContactos() with empty response returns empty array (not throws)
 *   - UNIT-EDGE-07 [P2] getByRecordId() with empty contacts returns empty array
 */

vi.mock('../../../../shared/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

import { apiClient } from '../../../../shared/lib/apiClient'
import { ClienteContactServiceAdapter } from '../presentation/ClienteContactServiceAdapter'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>

const CLIENT_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

const buildMockContacto = (overrides?: Partial<{
  id: string;
  nombre: string;
  cargo: string | null;
  telefono: string | null;
  email: string | null;
  clienteId: string;
  createdAt: string;
  updatedAt: string;
}>) => ({
  id: '550e8400-e29b-41d4-a716-446655440001',
  nombre: 'María García',
  cargo: 'Gerente Comercial',
  telefono: '+57 1 234 5679',
  email: 'm.garcia@empresa.com',
  clienteId: CLIENT_ID,
  createdAt: '2026-05-21T10:30:00Z',
  updatedAt: '2026-05-21T10:30:00Z',
  ...overrides,
})

describe('ClienteContactServiceAdapter — Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // UNIT-EDGE-01 [P1]
  // Given a contact returned from the API with all fields populated
  // When getByRecordId() is called
  // Then the returned Contact object has the required fields mapped correctly
  //   id, recordId === clienteId, name === nombre, emails === [email], description === cargo
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-EDGE-01 — getByRecordId() mapea correctamente Contacto → Contact contract', async () => {
    // GIVEN
    const mockContacto = buildMockContacto()
    mockGet.mockResolvedValueOnce({ data: [mockContacto] })

    const adapter = new ClienteContactServiceAdapter(CLIENT_ID)

    // WHEN
    const result = await adapter.getByRecordId(CLIENT_ID)

    // THEN — array has 1 Contact
    expect(result).toHaveLength(1)
    const contact = result[0]

    // id is preserved
    expect(contact.id).toBe(mockContacto.id)

    // recordId is the clienteId (association key)
    expect(contact.recordId).toBe(CLIENT_ID)

    // name maps from nombre
    expect(contact.name).toBe(mockContacto.nombre)

    // emails wraps email in array
    expect(contact.emails).toEqual([mockContacto.email])

    // description maps from cargo
    expect(contact.description).toBe(mockContacto.cargo)
  })

  // ---------------------------------------------------------------------------
  // UNIT-EDGE-02 [P1]
  // Given a contact with cargo === null
  // When getByRecordId() maps it
  // Then description === null (not undefined, not empty string)
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-EDGE-02 — getByRecordId() mapea cargo null a description: null', async () => {
    // GIVEN — contact with null cargo
    const mockContacto = buildMockContacto({ cargo: null })
    mockGet.mockResolvedValueOnce({ data: [mockContacto] })

    const adapter = new ClienteContactServiceAdapter(CLIENT_ID)

    // WHEN
    const result = await adapter.getByRecordId(CLIENT_ID)

    // THEN
    expect(result[0].description).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // UNIT-EDGE-03 [P1]
  // Given a contact with email === null
  // When getByRecordId() maps it
  // Then emails === [] (empty array, not [null])
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-EDGE-03 — getByRecordId() mapea email null a emails: []', async () => {
    // GIVEN — contact with null email
    const mockContacto = buildMockContacto({ email: null })
    mockGet.mockResolvedValueOnce({ data: [mockContacto] })

    const adapter = new ClienteContactServiceAdapter(CLIENT_ID)

    // WHEN
    const result = await adapter.getByRecordId(CLIENT_ID)

    // THEN — emails is an empty array (no null entries)
    expect(result[0].emails).toEqual([])
  })

  // ---------------------------------------------------------------------------
  // UNIT-EDGE-04 [P1]
  // Given the save() method (Story 4.1 scope: no-op)
  // When save() is called with any arguments
  // Then it resolves without error AND does NOT call apiClient (no side effects)
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-EDGE-04 — save() es un no-op y no llama a apiClient', async () => {
    // GIVEN
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID)
    const mockPut = apiClient.put as ReturnType<typeof vi.fn>

    // WHEN — call save() with a recordId and an empty contacts array
    await expect(adapter.save(CLIENT_ID, [])).resolves.toBeUndefined()

    // THEN — apiClient.put was NOT called (true no-op)
    expect(mockPut).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // UNIT-EDGE-05 [P2]
  // Given the adapter is constructed
  // When lookupConfig is accessed
  // Then it is defined and contains the expected fetcher and socialNetworkTypes fields
  // ---------------------------------------------------------------------------
  it('[P2] UNIT-EDGE-05 — lookupConfig está inicializado tras la construcción', () => {
    // GIVEN / WHEN — construct the adapter
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID)

    // THEN — lookupConfig is defined
    expect(adapter.lookupConfig).toBeDefined()
    expect(typeof adapter.lookupConfig.fetcher).toBe('function')
    expect(adapter.lookupConfig.socialNetworkTypes).toBeDefined()
    expect(adapter.lookupConfig.countries).toBeDefined()
  })

  // ---------------------------------------------------------------------------
  // UNIT-EDGE-06 [P2]
  // Given the API returns an empty array for getContactos()
  // When getContactos() is called
  // Then it returns [] without throwing
  // ---------------------------------------------------------------------------
  it('[P2] UNIT-EDGE-06 — getContactos() retorna array vacío cuando el API responde []', async () => {
    // GIVEN
    mockGet.mockResolvedValueOnce({ data: [] })

    const adapter = new ClienteContactServiceAdapter(CLIENT_ID)

    // WHEN
    const result = await adapter.getContactos()

    // THEN — empty array, no exception
    expect(result).toEqual([])
  })

  // ---------------------------------------------------------------------------
  // UNIT-EDGE-07 [P2]
  // Given the API returns an empty array for a client with no contacts
  // When getByRecordId() is called
  // Then it returns [] (no mapping errors on empty input)
  // ---------------------------------------------------------------------------
  it('[P2] UNIT-EDGE-07 — getByRecordId() retorna [] cuando el cliente no tiene contactos', async () => {
    // GIVEN
    mockGet.mockResolvedValueOnce({ data: [] })

    const adapter = new ClienteContactServiceAdapter(CLIENT_ID)

    // WHEN
    const result = await adapter.getByRecordId(CLIENT_ID)

    // THEN — empty array
    expect(result).toEqual([])
  })
})
