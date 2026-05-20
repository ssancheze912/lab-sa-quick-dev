<!-- FEATURE_CODE_JIRA=PENDING:gestion-de-clientes -->
## Gestión de Clientes

### Epic 2: Client Management

The commercial team can register, view, search, update, and delete client records, keeping the client base organized and up to date.

#### Acceptance Criteria (QA Validation)

- [ ] **AC-E2.1:** Un usuario puede registrar un nuevo cliente completando Nombre, NIT/RUC, Teléfono y Ciudad, y el cliente aparece en la lista inmediatamente
- [ ] **AC-E2.2:** Un usuario puede buscar clientes por nombre o NIT/RUC y ver resultados en menos de 1 segundo
- [ ] **AC-E2.3:** Un usuario puede ver el detalle completo de un cliente, editar cualquier campo y guardar los cambios
- [ ] **AC-E2.4:** El sistema impide guardar un cliente con campos requeridos vacíos, mostrando mensajes de error claros
- [ ] **AC-E2.5:** Un usuario puede eliminar un cliente y este deja de aparecer en la lista
- [ ] **AC-E2.6:** Un usuario puede ordenar la lista de clientes por Nombre A→Z, Nombre Z→A, Más reciente o Más antiguo sin recargar la página ni perder el filtro de búsqueda activo

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8

#### Story 2.1: Client List & Search

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

**Acceptance Criteria:**

**Given** there are clients in the system
**When** the user navigates to `/clientes`
**Then** the left panel (280px) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item

**Given** the client list is loaded
**When** the user types in the search field
**Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input
**And** results appear in under 1 second with up to 500 records (NFR1)

**Given** there are no clients in the system
**When** the user navigates to `/clientes`
**Then** an EmptyState component is displayed with a message guiding the user to create the first client

**Given** the backend is unavailable when the page loads
**When** the fetch fails
**Then** an ErrorPanel with a "Reintentar" button is displayed instead of the list

#### Story 2.2: Client Detail View

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
So that I can review all their information without navigating away from the clients section.

**Acceptance Criteria:**

**Given** the client list is displayed
**When** the user clicks on a client item
**Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad
**And** the URL updates to `/clientes/:clienteId` (FR30 deep linking)

**Given** the user is on the client detail view
**When** the user accesses the URL `/clientes/:clienteId` directly
**Then** the correct client details are loaded and displayed (FR30)

**Given** a clienteId in the URL does not exist
**When** the page loads
**Then** a not-found message is displayed gracefully

#### Story 2.3: Create Client

As a commercial team member,
I want to register a new client by filling in a form,
So that the client is available in the system immediately for the whole team.

**Acceptance Criteria:**

**Given** the user is on the `/clientes` view
**When** the user clicks "Nuevo cliente"
**Then** a form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad (all required per FR1)

**Given** the user fills all required fields and submits
**When** the form is submitted
**Then** the client is created and appears in the client list immediately (FR27)
**And** a toast de éxito muestra "Cliente creado correctamente"

**Given** the user submits the form with one or more required fields empty
**When** the form is validated
**Then** clear inline error messages appear on the empty fields (FR8)
**And** the form is NOT submitted to the backend

**Given** the user submits a NIT/RUC that already exists in the system
**When** the backend returns a 409 conflict
**Then** an error message indicates "El NIT/RUC ya está registrado" without exposing technical details (NFR6)

#### Story 2.4: Edit Client

As a commercial team member,
I want to edit any field of an existing client,
So that the client information stays up to date.

**Acceptance Criteria:**

**Given** the user is viewing a client's detail
**When** the user clicks "Editar"
**Then** the client form opens pre-filled with the current values of all fields (FR6)

**Given** the user modifies one or more fields and submits
**When** the form is saved
**Then** the changes are reflected in the client detail and list immediately (FR27)
**And** a toast de éxito muestra "Cliente actualizado correctamente"

**Given** the user clears a required field and submits
**When** the form is validated
**Then** an inline error message appears and the form is NOT submitted (FR8)

**Given** the user clicks "Cancelar" without saving
**When** the form closes
**Then** the original client data remains unchanged

#### Story 2.5: Delete Client

As a commercial team member,
I want to delete a client record,
So that the client list only contains active and relevant records.

**Acceptance Criteria:**

**Given** the user is viewing a client's detail
**When** the user clicks "Eliminar"
**Then** a confirmation dialog appears asking "¿Eliminar este cliente?" with "Confirmar" and "Cancelar" options

**Given** the user confirms the deletion
**When** the deletion is processed
**Then** the client is removed from the list immediately (FR27)
**And** the right panel returns to the empty/default state
**And** a toast muestra "Cliente eliminado correctamente"

**Given** the user clicks "Cancelar" in the confirmation dialog
**When** the dialog closes
**Then** the client record remains in the system unchanged

**Given** the client being deleted has associated contacts
**When** the deletion is confirmed and processed
**Then** the client record is deleted
**And** all previously associated contacts remain in the system with their data intact
**And** those contacts become unassigned (`clienteId = null`) and appear in the "Sin cliente" filter (FR25)
**And** the toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

#### Story 2.6: Sort Client List

As a commercial team member,
I want to sort the client list by different criteria,
So that I can organize my view and quickly find clients based on how I prioritize them.

**Acceptance Criteria:**

**Given** the client list is loaded with at least two clients
**When** the user selects "Nombre A→Z" from the SortControl component
**Then** the client list reorders alphabetically ascending by Nombre without triggering a new API call

**Given** the client list is loaded
**When** the user selects "Nombre Z→A" from the SortControl
**Then** the client list reorders alphabetically descending by Nombre without a new API call

**Given** the client list is loaded
**When** the user selects "Más reciente"
**Then** the client list orders by creation date descending (newest client appears first)

**Given** the client list is loaded
**When** the user selects "Más antiguo"
**Then** the client list orders by creation date ascending (oldest client appears first)

**Given** an active search filter is applied
**When** the user changes the sort order via SortControl
**Then** the sort is applied to the already-filtered result set without clearing the search input

**Given** the SortControl renders on initial page load
**When** no sort preference has been set
**Then** the default sort order is "Más reciente"

**Technical Context:**
- Sorting is performed client-side over the TanStack Query cache — no additional fetch triggered
- Sort state is managed with local React `useState`
- `SortControl` component lives at `src/shared/components/SortControl`
- Sort option identifiers: `nombre-asc` | `nombre-desc` | `fecha-desc` | `fecha-asc`
