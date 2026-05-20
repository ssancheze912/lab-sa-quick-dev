---
stepsCompleted: [1, 2, 3, 4]
status: complete
completedAt: '2026-03-12'
inputDocuments:
  - _bmad-output/planning-artifacts/prd/index.md
  - _bmad-output/planning-artifacts/prd/functional-requirements.md
  - _bmad-output/planning-artifacts/prd/non-functional-requirements.md
  - _bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md
  - _bmad-output/planning-artifacts/prd/feature-gestion-de-contactos.md
  - _bmad-output/planning-artifacts/prd/feature-asociacion-cliente-contacto.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# Siesa-Agents - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Siesa-Agents, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories organized by feature.

**Features:**
- Gestión de Clientes
- Gestión de Contactos
- Asociación Cliente-Contacto

**Structure rules (sharding-aware):**
- `##` Feature → `###` Epic N → `####` Story N.M
- Epic numbering is **global and consecutive** (does not restart per feature)

---

## Requirements Inventory

### Functional Requirements

FR1: Users can create a new client record with the required fields (Name, NIT/RUC, Phone, City)
FR2: Users can view a paginated or scrollable list of all clients
FR3: Users can search the client list by client name
FR4: Users can search the client list by NIT/RUC
FR5: Users can view the complete details of a specific client record
FR6: Users can edit any field of an existing client record
FR7: Users can delete a client record from the system
FR8: The system prevents saving a client record with missing required fields
FR9: Users can create a new contact record with the required fields (Name, Role/Title, Phone, Email)
FR10: Users can view a list of all contacts
FR11: Users can search the contact list by contact name
FR12: Users can search the contact list by email
FR13: Users can view the complete details of a specific contact record
FR14: Users can edit any field of an existing contact record
FR15: Users can delete a contact record from the system
FR16: The system prevents saving a contact record with missing required fields
FR17: Users can associate one or more existing contacts to a client
FR18: Users can associate a contact to a client at the time of contact creation
FR19: Users can associate a contact to a client from within the client detail view without navigating away
FR20: Users can disassociate a contact from a client without deleting either record
FR21: Users can view all contacts associated with a client directly within the client detail view
FR22: Users can navigate from the client detail view to any associated contact's detail view
FR23: Users can view which client a contact is associated with directly from the contact detail view
FR24: Users can navigate from the contact detail view to the associated client's detail view
FR25: Users can identify contacts that are not associated with any client
FR26: Users can reassign a contact from one client to a different client
FR27: The system reflects all data changes (create, update, delete, associate, disassociate) immediately for all users without requiring a manual sync
FR28: Users can navigate between views without full page reloads (SPA)
FR29: Users can access and use the full application from a mobile browser viewport
FR30: Users can access the application directly via URL routes for any view (deep linking)

### NonFunctional Requirements

NFR1: Search operations (client by name/NIT, contact by name/email) must return and render results in under 1 second with up to 500 records in the database
NFR2: All CRUD operations (create, edit, delete) must reflect changes in the UI in under 2 seconds under normal conditions
NFR3: The application must remain responsive with up to 10 simultaneous active users without measurable degradation
NFR4: All data exchanged between the frontend and backend must be transmitted over HTTPS in any non-local deployment
NFR5: The API must validate and sanitize all user inputs before persisting data to prevent injection attacks
NFR6: The application must not expose internal error details or stack traces to end users
NFR7: A new user must be able to complete core tasks (find a client, view their contacts, register a new client with a contact) without any training or documentation
NFR8: The application must require no more than 2 clicks to navigate from a client record to any of its associated contacts
NFR9: The application must require no additional search or navigation to view a contact's associated client from the contact detail view
NFR10: The system is designed and scoped for a maximum of 500 client records, 1,000 contact records, and 10 simultaneous users in MVP
NFR11: The data model must support future expansion of these limits without requiring schema redesign (no hardcoded limits in the data layer)

### Additional Requirements

**From Architecture:**
- Project initialization required first: Vite react-ts (frontend) + dotnet new webapi with Clean Architecture layers (backend) — this is the foundation story (Epic 1, Story 1)
- Clean Architecture + DDD applied to both frontend and backend
- siesa-ui-kit ContactManager component must be integrated via IContactServiceAdapter implementation (ClienteContactServiceAdapter)
- Problem Details RFC 7807 for all API error responses via ExceptionHandlingMiddleware
- TanStack Query mandatory invalidation pattern after every mutation (invalidateQueries)
- CORS configuration: allow localhost:5173 in development
- PostgreSQL local database: siesa_agents_db with UUID PKs and snake_case naming via ApplySnakeCaseNaming()
- Dev ports: frontend 5173, backend 5000 (HTTP) / 5001 (HTTPS)
- EF Core migrations required for schema setup
- Scalar for API documentation (never Swagger/OpenAPI default)
- All user-facing text in Spanish (P0 mandatory)

**From UX Design:**
- Responsive layout with critical breakpoint lg: 1024px — split panel layout: ClienteListView (280px left panel) + ClienteDetailView (flex right panel)
- Mobile-responsive NavigationBar / NavigationRail from siesa-ui-kit
- WCAG AA accessibility compliance
- Spanish UI text for all labels, buttons, errors, toasts, placeholders, and ARIA labels
- Direction F visual design (clean, professional, enterprise feel)
- Empty state components for lists with no data

### FR Coverage Map

| FR | Épica | Descripción |
|---|---|---|
| FR1 | Epic 2 | Crear cliente con campos requeridos |
| FR2 | Epic 2 | Ver lista de clientes |
| FR3 | Epic 2 | Buscar cliente por nombre |
| FR4 | Epic 2 | Buscar cliente por NIT/RUC |
| FR5 | Epic 2 | Ver detalle de cliente |
| FR6 | Epic 2 | Editar cliente |
| FR7 | Epic 2 | Eliminar cliente |
| FR8 | Epic 2 | Validación campos requeridos (cliente) |
| FR9 | Epic 3 | Crear contacto con campos requeridos |
| FR10 | Epic 3 | Ver lista de contactos |
| FR11 | Epic 3 | Buscar contacto por nombre |
| FR12 | Epic 3 | Buscar contacto por email |
| FR13 | Epic 3 | Ver detalle de contacto |
| FR14 | Epic 3 | Editar contacto |
| FR15 | Epic 3 | Eliminar contacto |
| FR16 | Epic 3 | Validación campos requeridos (contacto) |
| FR17 | Epic 4 | Asociar contactos existentes a cliente |
| FR18 | Epic 4 | Asociar contacto al momento de creación |
| FR19 | Epic 4 | Asociar desde detalle de cliente sin navegar |
| FR20 | Epic 4 | Desasociar contacto de cliente |
| FR21 | Epic 4 | Ver contactos del cliente en su detalle |
| FR22 | Epic 4 | Navegar de cliente a detalle de contacto |
| FR23 | Epic 4 | Ver cliente asociado desde detalle de contacto |
| FR24 | Epic 4 | Navegar de contacto a detalle de cliente |
| FR25 | Epic 4 | Filtrar contactos sin cliente (huérfanos) |
| FR26 | Epic 4 | Reasignar contacto a otro cliente |
| FR27 | Epic 4 | Cambios inmediatos para todos los usuarios |
| FR28 | Epic 1 | Navegación SPA sin recargas |
| FR29 | Epic 1 | Acceso desde móvil |
| FR30 | Epic 1 | Deep linking via URL |

## Epic List

### Foundation

- Epic 1: Project Foundation & Application Shell — FRs: FR28, FR29, FR30

### Gestión de Clientes

- Epic 2: Client Management — FRs: FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8

### Gestión de Contactos

- Epic 3: Contact Management — FRs: FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16

### Asociación Cliente-Contacto

- Epic 4: Client-Contact Association & Data Quality — FRs: FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27

---

## Foundation

### Epic 1: Project Foundation & Application Shell

The technical foundation is in place — frontend and backend projects are initialized with Clean Architecture, dev servers are running, and users can navigate the application shell with functional routes on desktop and mobile.

#### Acceptance Criteria (QA Validation)

- [ ] **AC-E1.1:** La aplicación carga y muestra una estructura de navegación accesible desde browser móvil y desktop
- [ ] **AC-E1.2:** El usuario puede navegar entre las secciones Clientes y Contactos sin recargas completas de página
- [ ] **AC-E1.3:** Acceder directamente a `/clientes` y `/contactos` via URL muestra las vistas correctas (deep linking)

**FRs covered:** FR28, FR29, FR30

#### Story 1.1: Project Initialization & Repository Structure

As a developer,
I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies,
So that the team has a working development environment with both servers running.

**Acceptance Criteria:**

**Given** a clean development machine with Node.js and .NET 10 installed
**When** the developer runs the frontend initialization commands
**Then** `npm run dev` starts the Vite server on port 5173 with no errors
**And** the app compiles with TypeScript strict mode enabled

**Given** the backend project has been created
**When** the developer runs `dotnet run` in SiesaAgents.API
**Then** the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`
**And** the four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in the solution

**Given** both projects are running
**When** the frontend makes a request to the backend
**Then** CORS allows requests from `localhost:5173` without errors

#### Story 1.2: Frontend Navigation Shell

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
So that I can move between sections without full page reloads from any device.

**Acceptance Criteria:**

**Given** the application is loaded on a desktop browser
**When** the user views the app
**Then** a NavigationRail (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries
**And** clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28)

**Given** the application is loaded on a mobile browser viewport
**When** the user views the app
**Then** a mobile-responsive NavigationBar (siesa-ui-kit) is displayed instead of the rail
**And** all navigation items are accessible and tappable (FR29)

**Given** the user types `/clientes` or `/contactos` directly in the browser URL bar
**When** the page loads
**Then** the correct view is rendered without redirection to a home screen (FR30)

**Given** the user navigates to an unknown route
**When** the page loads
**Then** a 404 / not-found view is displayed gracefully

#### Story 1.3: Backend Database Foundation

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
So that subsequent stories can define entities and run migrations against a working data layer.

**Acceptance Criteria:**

**Given** PostgreSQL is running locally
**When** the developer runs `dotnet ef database update`
**Then** the `siesa_agents_db` database is created with no errors
**And** EF Core migrations folder exists in SiesaAgents.Infrastructure

**Given** an unhandled exception occurs in the backend
**When** the error reaches the middleware
**Then** the response returns Problem Details RFC 7807 format (status, title, detail) with no stack traces exposed (NFR6)

**Given** the backend receives any request
**When** the request is processed
**Then** `ApplySnakeCaseNaming()` is applied in `OnModelCreating` and all future column names follow snake_case convention

---

## Gestión de Clientes

### Epic 2: Client Management

The commercial team can register, view, search, update, and delete client records, keeping the client base organized and up to date.

#### Acceptance Criteria (QA Validation)

- [ ] **AC-E2.1:** Un usuario puede registrar un nuevo cliente completando Nombre, NIT/RUC, Teléfono y Ciudad, y el cliente aparece en la lista inmediatamente
- [ ] **AC-E2.2:** Un usuario puede buscar clientes por nombre o NIT/RUC y ver resultados en menos de 1 segundo
- [ ] **AC-E2.3:** Un usuario puede ver el detalle completo de un cliente, editar cualquier campo y guardar los cambios
- [ ] **AC-E2.4:** El sistema impide guardar un cliente con campos requeridos vacíos, mostrando mensajes de error claros
- [ ] **AC-E2.5:** Un usuario puede eliminar un cliente y este deja de aparecer en la lista

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

---

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

---

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
