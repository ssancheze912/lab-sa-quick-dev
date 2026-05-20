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

> **Scope note:** This story creates an empty initial migration (no domain tables). The `clientes` table is created in Epic 2 Story 2.1. The `contactos` table is created in Epic 3 Story 3.1. Do NOT define `ClienteEntity` or `ContactoEntity` in this story.
