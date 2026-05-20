<!-- FEATURE_CODE_JIRA=PENDING:asociacion-cliente-contacto -->
## Asociación Cliente-Contacto

### Epic 4: Client-Contact Association & Data Quality

The commercial team can link and unlink contacts to clients, navigate bidirectionally between them, identify orphan contacts, and reassign them — all changes reflected immediately for all users.

#### Acceptance Criteria (QA Validation)

- [ ] **AC-E4.1:** Un usuario puede asociar un contacto existente a un cliente directamente desde el detalle del cliente sin navegar a otra pantalla
- [ ] **AC-E4.2:** El usuario puede ver todos los contactos asociados a un cliente en el detalle del cliente, y navegar al detalle de cualquier contacto en 2 clics o menos
- [ ] **AC-E4.3:** Desde el detalle de un contacto, el usuario puede ver a qué cliente pertenece y navegar a ese cliente en un clic
- [ ] **AC-E4.4:** Un usuario puede desasociar un contacto de un cliente sin eliminar ninguno de los dos registros
- [ ] **AC-E4.5:** Un usuario puede filtrar la lista de contactos para ver únicamente los que no están asociados a ningún cliente
- [ ] **AC-E4.6:** Un usuario puede reasignar un contacto de un cliente a otro
- [ ] **AC-E4.7:** Todos los cambios son visibles de forma inmediata para todos los usuarios sin necesidad de refrescar la página

**FRs covered:** FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27

#### Story 4.1: View Associated Contacts in Client Detail

As a commercial team member,
I want to see all contacts associated with a client directly within the client detail view,
So that I have a complete picture of that client's contacts without navigating elsewhere.

**Acceptance Criteria:**

**Given** a client has associated contacts
**When** the user opens the client detail view
**Then** the ContactManager (siesa-ui-kit) is rendered in the right panel showing all contacts linked to that client (FR21)
**And** the ContactManager uses the `ClienteContactServiceAdapter` wired to `GET /api/v1/contactos?clienteId=:id`

**Given** a client has no associated contacts
**When** the user opens the client detail view
**Then** the ContactManager displays an empty state indicating no contacts are linked yet

**Given** the backend is unavailable when loading the client's contacts
**When** the fetch fails
**Then** the ContactManager displays an error state with a retry option

#### Story 4.2: Associate & Disassociate Contacts from Client

As a commercial team member,
I want to associate existing contacts to a client and disassociate them directly from the client detail view,
So that I can manage the client's contact relationships without navigating away.

**Acceptance Criteria:**

**Given** the user is in the client detail view
**When** the user uses the ContactManager to add an existing contact
**Then** the contact is linked to the client immediately and appears in the ContactManager list (FR17, FR19, FR27)
**And** `PUT /api/v1/contactos/{id}/cliente` is called with `{ clienteId: uuid }`
**And** queryKeys `['contactos']` and `['contactos', { clienteId }]` are invalidated

**Given** the user creates a new contact from within the ContactManager
**When** the contact is created
**Then** the new contact is automatically associated with the current client (FR18)
**And** the contact appears in the ContactManager list immediately

**Given** the user disassociates a contact from the client via ContactManager
**When** the disassociation is confirmed
**Then** the contact is removed from the ContactManager list immediately (FR20, FR27)
**And** `PUT /api/v1/contactos/{id}/cliente` is called with `{ clienteId: null }`
**And** the contact record still exists and is accessible from `/contactos`

#### Story 4.3: Navigate from Client Detail to Contact Detail

As a commercial team member,
I want to navigate from a contact listed in the client detail to that contact's full detail view,
So that I can access all contact information with no more than 2 clicks from the client.

**Acceptance Criteria:**

**Given** the user is in the client detail view and contacts are listed in the ContactManager
**When** the user clicks on a contact item
**Then** the user is navigated to `/contactos/:contactoId` showing the full contact detail (FR22)
**And** the navigation requires no more than 2 clicks from the client record (NFR8)

**Given** the user navigated to a contact from the client detail
**When** the user clicks the browser back button or a "Volver" link
**Then** the user returns to the client detail view

#### Story 4.4: View Associated Client from Contact Detail

As a commercial team member,
I want to see which client a contact is associated with directly from the contact detail view,
So that I can understand the relationship without additional navigation.

**Acceptance Criteria:**

**Given** a contact is associated with a client
**When** the user views the contact detail
**Then** the associated client's name is displayed in the contact detail (FR23)
**And** no additional search or navigation is required to see this information (NFR9)

**Given** the associated client name is displayed
**When** the user clicks on the client name link
**Then** the user is navigated to `/clientes/:clienteId` showing the full client detail (FR24)

**Given** a contact has no associated client
**When** the user views the contact detail
**Then** a message indicates "Sin cliente asignado" (FR23)

#### Story 4.5: Orphan Contacts Filter

As a commercial team member,
I want to filter the contact list to show only contacts not associated with any client,
So that I can identify and manage unassigned contacts easily.

**Acceptance Criteria:**

**Given** the user is on the `/contactos` view
**When** the user activates the "Sin cliente" filter
**Then** the list shows only contacts whose `clienteId` is null (FR25)
**And** the count of orphan contacts is visible

**Given** the "Sin cliente" filter is active
**When** all contacts have a client assigned
**Then** an empty state is shown indicating all contacts are assigned

**Given** the "Sin cliente" filter is active
**When** the user deactivates it
**Then** the full contact list is restored

#### Story 4.6: Reassign Contact to Different Client

As a commercial team member,
I want to reassign a contact from one client to a different client,
So that I can correct associations or reflect organizational changes.

**Acceptance Criteria:**

**Given** the user is viewing a contact detail that is associated with a client
**When** the user initiates a reassignment action
**Then** a selector shows all available clients to choose from

**Given** the user selects a different client and confirms
**When** the reassignment is saved
**Then** the contact appears in the new client's ContactManager and is removed from the previous client's list (FR26, FR27)
**And** `PUT /api/v1/contactos/{id}/cliente` is called with the new `{ clienteId: uuid }`
**And** queryKeys `['contactos']`, `['contactos', { clienteId: oldId }]`, and `['contactos', { clienteId: newId }]` are invalidated
**And** a toast muestra "Contacto reasignado correctamente"

**Given** the user cancels the reassignment
**When** the selector closes
**Then** the contact's client association remains unchanged
