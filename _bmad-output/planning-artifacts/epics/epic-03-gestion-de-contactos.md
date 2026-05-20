<!-- FEATURE_CODE_JIRA=PENDING:gestion-de-contactos -->
## Gestión de Contactos

### Epic 3: Contact Management

The commercial team can register, view, search, update, and delete contact records independently of any client relationship.

#### Acceptance Criteria (QA Validation)

- [ ] **AC-E3.1:** Un usuario puede registrar un nuevo contacto con Nombre, Cargo, Teléfono y Email, y el contacto aparece en la lista inmediatamente
- [ ] **AC-E3.2:** Un usuario puede buscar contactos por nombre o email y ver resultados en menos de 1 segundo
- [ ] **AC-E3.3:** Un usuario puede ver el detalle completo de un contacto, editar cualquier campo y guardar los cambios
- [ ] **AC-E3.4:** El sistema impide guardar un contacto con campos requeridos vacíos, mostrando mensajes de error claros
- [ ] **AC-E3.5:** Un usuario puede eliminar un contacto y este deja de aparecer en la lista

**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16

#### Story 3.1: Contact List & Search

As a commercial team member,
I want to see a list of all contacts and search them by name or email,
So that I can quickly find any contact regardless of their client association.

**Acceptance Criteria:**

**Given** there are contacts in the system
**When** the user navigates to `/contactos`
**Then** a list of all contacts is displayed showing Nombre, Cargo, and Email per item (FR10)

**Given** the contact list is loaded
**When** the user types in the search field
**Then** the list filters in real time showing only contacts whose Nombre or Email match the input
**And** results appear in under 1 second with up to 1,000 records (NFR1, FR11, FR12)

**Given** there are no contacts in the system
**When** the user navigates to `/contactos`
**Then** an EmptyState component is displayed guiding the user to create the first contact

**Given** the backend is unavailable when the page loads
**When** the fetch fails
**Then** an ErrorPanel with a "Reintentar" button is displayed instead of the list

#### Story 3.2: Contact Detail View

As a commercial team member,
I want to view the complete details of a contact by selecting them from the list,
So that I can review all their information at once.

**Acceptance Criteria:**

**Given** the contact list is displayed
**When** the user clicks on a contact item
**Then** the contact detail view shows: Nombre, Cargo, Teléfono, Email (FR13)
**And** the URL updates to `/contactos/:contactoId` (FR30)

**Given** the user accesses `/contactos/:contactoId` directly via URL
**When** the page loads
**Then** the correct contact details are displayed (FR30)

**Given** a contactoId in the URL does not exist
**When** the page loads
**Then** a not-found message is displayed gracefully

#### Story 3.3: Create Contact

As a commercial team member,
I want to register a new contact by filling in a form,
So that the contact is available in the system immediately for the whole team.

**Acceptance Criteria:**

**Given** the user is on the `/contactos` view
**When** the user clicks "Nuevo contacto"
**Then** a form opens with fields: Nombre, Cargo, Teléfono, Email (all required per FR9)

**Given** the user fills all required fields and submits
**When** the form is submitted
**Then** the contact is created and appears in the contact list immediately (FR27)
**And** a toast de éxito muestra "Contacto creado correctamente"

**Given** the user submits the form with one or more required fields empty
**When** the form is validated
**Then** clear inline error messages appear on the empty fields (FR16)
**And** the form is NOT submitted to the backend

**Given** the backend returns a validation error
**When** the error is received
**Then** the error message is displayed clearly without exposing technical details (NFR6)

#### Story 3.4: Edit Contact

As a commercial team member,
I want to edit any field of an existing contact,
So that the contact information stays current.

**Acceptance Criteria:**

**Given** the user is viewing a contact's detail
**When** the user clicks "Editar"
**Then** the contact form opens pre-filled with the current values of all fields (FR14)

**Given** the user modifies one or more fields and submits
**When** the form is saved
**Then** the changes are reflected in the contact detail and list immediately (FR27)
**And** a toast de éxito muestra "Contacto actualizado correctamente"

**Given** the user clears a required field and submits
**When** the form is validated
**Then** an inline error message appears and the form is NOT submitted (FR16)

**Given** the user clicks "Cancelar" without saving
**When** the form closes
**Then** the original contact data remains unchanged

#### Story 3.5: Delete Contact

As a commercial team member,
I want to delete a contact record,
So that the contact list only contains relevant records.

**Acceptance Criteria:**

**Given** the user is viewing a contact's detail
**When** the user clicks "Eliminar"
**Then** a confirmation dialog appears asking "¿Eliminar este contacto?" with "Confirmar" and "Cancelar" options

**Given** the user confirms the deletion
**When** the deletion is processed
**Then** the contact is removed from the list immediately (FR27)
**And** the view returns to the contact list
**And** a toast muestra "Contacto eliminado correctamente"

**Given** the user clicks "Cancelar" in the confirmation dialog
**When** the dialog closes
**Then** the contact record remains in the system unchanged
