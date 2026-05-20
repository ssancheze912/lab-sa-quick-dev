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
