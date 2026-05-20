<!-- FEATURE_CODE_JIRA=PENDING:stats-dashboard -->
## Stats Dashboard

### Epic 5: Application Stats Dashboard

The commercial team can view a summary dashboard showing the current state of the CRM data — total clients, total contacts, and orphan contacts — so they can assess data health at a glance without navigating through each section.

#### Acceptance Criteria (QA Validation)

- [ ] **AC-E5.1:** El endpoint `GET /api/v1/stats` devuelve `totalClientes`, `totalContactos` y `contactosSinCliente` con datos precisos y en menos de 500ms
- [ ] **AC-E5.2:** El usuario puede navegar a `/inicio` y ver un panel con las 3 estadísticas del CRM sin necesidad de recargar la página
- [ ] **AC-E5.3:** Las estadísticas se actualizan automáticamente después de crear, editar o eliminar un cliente o contacto (TanStack Query invalidation)
- [ ] **AC-E5.4:** Cuando el backend no está disponible, el dashboard muestra un estado de error con opción de reintentar

**FRs covered:** (nuevo — mejora de observabilidad del sistema, no cubierta por FRs existentes)

---

#### Story 5.1: Backend Stats Endpoint

As a commercial team member,
I want the application to expose a summary of CRM data counts,
So that the frontend can display at-a-glance statistics without N+1 queries.

**Acceptance Criteria:**

**Given** hay clientes y contactos en el sistema
**When** se llama `GET /api/v1/stats`
**Then** la respuesta es `200 OK` con un JSON:
```json
{
  "totalClientes": 12,
  "totalContactos": 45,
  "contactosSinCliente": 7
}
```
**And** la respuesta se genera en menos de 500ms con hasta 500 clientes y 1,000 contactos

**Given** la base de datos está vacía
**When** se llama `GET /api/v1/stats`
**Then** la respuesta es `200 OK` con `{ "totalClientes": 0, "totalContactos": 0, "contactosSinCliente": 0 }`

**Given** ocurre un error inesperado en la base de datos
**When** se llama `GET /api/v1/stats`
**Then** el middleware de excepción devuelve `500 Internal Server Error` con Problem Details (RFC 7807)

**Technical Notes:**
- Clean Architecture: crear `GetStatsQuery` + `GetStatsQueryHandler` + `StatsDto` en `SiesaAgents.Application/Stats/`
- El handler usa `IClienteRepository` e `IContactoRepository` para obtener los conteos
- Registrar el endpoint en `SiesaAgents.API/Endpoints/StatsEndpoints.cs`
- No requiere migration de base de datos (solo queries de conteo)

---

#### Story 5.2: Stats Dashboard Frontend

As a commercial team member,
I want to see a dashboard with key CRM statistics when I open the application,
So that I can quickly assess the current state of clients and contacts.

**Acceptance Criteria:**

**Given** el usuario navega a `/inicio`
**When** la página carga
**Then** se muestran 3 tarjetas de estadística: "Total Clientes", "Total Contactos" y "Contactos sin cliente"
**And** cada tarjeta muestra el número correspondiente obtenido de `GET /api/v1/stats`

**Given** el usuario crea, edita o elimina un cliente o contacto
**When** regresa a `/inicio`
**Then** las estadísticas reflejan el estado actualizado (TanStack Query `invalidateQueries` con key `['stats']`)

**Given** el backend no está disponible al cargar `/inicio`
**When** la llamada a `GET /api/v1/stats` falla
**Then** se muestra un `ErrorPanel` con botón "Reintentar"

**Given** el usuario está en cualquier parte de la app
**When** hace clic en "Inicio" en la barra de navegación
**Then** navega a `/inicio` sin recargar la página (TanStack Router, SPA navigation)

**Technical Notes:**
- Crear ruta `frontend/src/routes/_app/inicio.tsx`
- Crear componente `frontend/src/modules/dashboard/presentation/StatsDashboard.tsx` con 3 `StatCard` subcomponents
- Crear hook `frontend/src/modules/dashboard/application/useStats.ts` usando TanStack Query
- Crear `frontend/src/modules/dashboard/infrastructure/statsApi.ts` con `fetchStats(): Promise<StatsDto>`
- Actualizar `frontend/src/routes/index.tsx`: cambiar redirect de `/clientes` a `/inicio`
- Agregar enlace "Inicio" al componente de navegación existente (antes del enlace "Clientes")
- Invalidar query key `['stats']` en las mutations de clientes y contactos existentes
