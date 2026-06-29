# Test Review — Story 4.1: View Associated Contacts in Client Detail

**Date**: 2026-06-29
**Reviewer**: TEA Review Agent (testarch-test-review)
**Story**: story-4.1-view-associated-contacts-in-client-detail.md
**Verdict**: PASS CON OBSERVACIONES

---

## Scope Revisado

| Archivo | Líneas | Tests | Estado declarado |
|---|---|---|---|
| `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.contactos.test.tsx` | 394 | 12 | 12/12 PASS |
| `frontend/src/modules/crm/contactos/application/useContactosByCliente.test.ts` | 331 | 12 | 12/12 PASS |
| `backend/tests/SiesaAgents.IntegrationTests/Contactos/ContactosByClienteIdTests.cs` | 456 | 9 | 9/9 PASS |

---

## Cobertura de Acceptance Criteria

| AC | Descripción | Cubierto por | Estado |
|---|---|---|---|
| AC#1 | ContactManager/ContactosSeccion renderiza cuando el cliente tiene contactos | TC-1 (component), TC-1 (integration) | PASS |
| AC#2 | Llama a `GET /api/v1/contactos?clienteId=:id` con query key `['contactos', { clienteId }]` | TC-1 (hook), TC-1 (integration) | PASS |
| AC#3 | Muestra "Sin contactos asociados" cuando no hay contactos | TC-2 (component), TC-2 (integration) | PASS |
| AC#4 | Muestra error state con botón "Reintentar" cuando el fetch falla | TC-4 (component), TC-3 (hook) | PASS |
| AC#5 | Muestra skeleton loading con `react-loading-skeleton` (sin spinners) | TC-3 (component), TC-3 (hook) | PASS |
| AC#6 | URL no cambia; deep-linking funciona | NO CUBIERTO DIRECTAMENTE | OBSERVACION |

**AC#6 (deep-linking)**: No hay test que valide explícitamente que navegar directamente a `/clientes/:clienteId` renderiza `ContactosSeccion` correctamente. Los tests de componente asumen que `clienteId` se inyecta por prop, pero no hay test de routing/integración a nivel de página completa. Aceptable para el nivel de pruebas actuales (es cobertura de E2E / route test que está fuera del alcance ATDD de esta historia), pero conviene documentar el gap.

---

## Revisión por Archivo

### 1. `useContactosByCliente.test.ts` (Hook Unit Tests)

**Estructura Given-When-Then**: PASS — todos los tests tienen comentarios explícitos `// GIVEN`, `// WHEN`, `// THEN`. Estructura clara y consistente.

**Hard waits**: PASS — se usa `delay(150/300)` de MSW únicamente para simular latencia de red controlada en MSW, no en el código de test (`await sleep()`). No hay `setTimeout` ni `sleep()` directos. Los asserts esperan con `waitFor`.

**Auto-cleanup en fixtures**: PASS — `beforeEach` llama a `server.listen()` y `afterEach` llama a `server.resetHandlers()` + `server.close()`. El `QueryClient` se crea fresh en cada test via `createWrapper()`. Sin estado compartido entre tests.

**Selectores `data-testid`**: N/A para hook tests. Los tests de hook no usan DOM selectors.

**Performance (<90s por test)**: PASS — máximo delay simulado es 300ms. Timeouts de `waitFor` son 2000ms. Sin operaciones de I/O reales.

**Tamaño (<300 líneas)**: PASS — 331 líneas. OBSERVACION MENOR: supera el límite por 31 líneas. El exceso se debe a comentarios de cabecera y docstrings informativos que no afectan la legibilidad.

**Una assertion principal por test (atómico)**: OBSERVACION — TC-1 tercer test ("should use canonical TanStack Query key") tiene dos `await waitFor` y dos `expect` separados para los dos hooks `r1` y `r2`. El test valida deduplicación de caché (una sola idea) pero con 4 assertions. Aceptable por coherencia conceptual.

**Nombres descriptivos**: PASS — nombres en inglés descriptivos tipo `'should return an array of contacts for a valid clienteId'`. Claros y unambiguos.

**Aislación por nivel**: PASS — nivel unit correcto: mock de red via MSW, sin render de DOM, sin base de datos.

**Issues encontrados**:
- OBSERVACION (W1): Archivo supera 300 líneas por 31 líneas. No crítico.
- OBSERVACION (W2): TC-3 último test (`'should expose isLoading true while fetch is in-flight'`) está categorizado dentro del describe de TC-3 (errores) pero valida estado de loading, que pertenece semánticamente a AC#5. El test es correcto pero su ubicación en el describe de TC-3 es engañosa.

---

### 2. `ClienteDetailView.contactos.test.tsx` (Component Tests)

**Estructura Given-When-Then**: PASS — todos los tests tienen bloques `// GIVEN`, `// WHEN`, `// THEN` explícitos.

**Hard waits**: PASS — se usa `delay(150)` de MSW para simular latencia. No hay `sleep()` ni `setTimeout` en el código de test. Los `waitFor` tienen timeouts razonables (3000ms máximo).

**Auto-cleanup en fixtures**: PASS — `beforeEach` llama a `server.listen({ onUnhandledRequest: 'error' })` y `afterEach` resetea y cierra el servidor. `QueryClient` fresco por cada test en `renderClienteDetailView`. Factories con `resetClienteCounter()` y `resetContactoCounter()` evitan colisiones de IDs.

**Selectores `data-testid`**: PASS — todos los selectores usan `getByTestId('cliente-contactos-seccion')`, `getByTestId('contactos-lista')`, `getByTestId('contactos-skeleton')`, `getByTestId('contactos-error-state')`, `getByTestId('contactos-empty-state')`. Todos existen en la implementación real (`ClienteDetailView.tsx`).

**Performance (<90s por test)**: PASS — delays máximos de 150ms. `waitFor` con timeout de 3000ms. Sin I/O real.

**Tamaño (<300 líneas)**: PASS — 394 líneas. OBSERVACION MENOR: supera el límite por 94 líneas. El exceso está justificado por el volumen de setup por test (MSW handlers, factories). Refactorizar helpers podría reducirlo.

**Una assertion principal por test (atómico)**: OBSERVACION — TC-1 segundo test tiene dos assertions secuenciales (`expect(getByTestId('contactos-lista'))` + `expect(getByText('Juan Pérez'))`). Son complementarias y forman una sola idea de negocio ("la lista muestra los contactos"), pero técnicamente son dos assertions.

TC-4 tercer test (`'should NOT display raw error messages'`) tiene tres `expect`: error-state presente, "Internal Server Error" ausente, "stack" ausente. Es defensiva y razonable pero tiene múltiples assertions negativas.

**Nombres descriptivos**: PASS — nombres descriptivos y en inglés.

**Aislación por nivel**: PASS — nivel component correcto: MSW para network, RTL para DOM, sin acceso a base de datos real.

**Issues encontrados**:
- OBSERVACION (W3): Archivo supera 300 líneas por 94 líneas. Candidato a extraer helpers de setup MSW a un fixture compartido.
- OBSERVACION (W4): TC-5 (Accessibility) no usa `axe-core` real — el test valida heading y elemento presente, no violations de axe. El comentario del test dice "requires axe-core integration" pero no lo implementa. El test pasa como chequeo de estructura DOM, no de accesibilidad completa. Gap documentado en el propio test.
- OBSERVACION (W5): TC-3 primer test asume que `contactos-skeleton` es visible inmediatamente en el primer render síncro (`expect(screen.getByTestId('contactos-skeleton')).toBeInTheDocument()` sin `await`). Esto funciona porque `onUnhandledRequest: 'error'` bloquea solicitudes no registradas y MSW delay hace que el handler tarde. Frágil si el entorno de test resuelve la promesa antes del primer tick de render. Técnicamente correcto pero depende de timing implícito.

---

### 3. `ContactosByClienteIdTests.cs` (Backend Integration Tests)

**Estructura Given-When-Then**: PASS — todos los métodos tienen comentarios `// GIVEN`, `// WHEN`, `// THEN` explícitos dentro del cuerpo del test.

**Hard waits**: PASS — sin `Thread.Sleep()`, `Task.Delay()` ni `await Task.Delay()` artificiales. Las operaciones son síncronas contra base de datos InMemory.

**Auto-cleanup en fixtures**: PASS — cada test instancia su propio `ContactosByClienteIdWebApplicationFactory` con `DatabaseName = $"...{Guid.NewGuid()}"`. Garantiza base de datos limpia e independiente por test. Sin estado compartido. Correcto.

**Selectores `data-testid`**: N/A para tests de API. Se valida el contrato HTTP/JSON, no el DOM.

**Performance (<90s por test)**: PASS — tests contra base de datos InMemory. Sin llamadas externas. Expected sub-segundos.

**Tamaño (<300 líneas)**: PASS — 456 líneas. OBSERVACION MENOR: supera el límite por 156 líneas. Justificado porque incluye tanto la factory class como la clase de tests. Si se separan los archivos quedaría bajo el límite.

**Una assertion principal por test (atómico)**: OBSERVACION — TC-1 tercer test (`TC1_GetContactosByClienteId_Returns_CorrectDtoShape`) tiene múltiples assertions sobre el shape del DTO (id, nombre, cargo, telefono, email, clienteId, createdAt). Es un test de contrato que por naturaleza valida múltiples campos del DTO. Aceptable en tests de integración de contrato de API.

**Nombres descriptivos**: PASS — nombres de método en PascalCase con patrón `TcN_Subject_ExpectedBehavior_WhenCondition`. Muy descriptivos y siguen convenciones C#.

**Aislación por nivel**: PASS — nivel integration correcto: `WebApplicationFactory` real, EF Core InMemory, sin mocks de repositorio.

**Issues encontrados**:
- OBSERVACION (W6): Archivo supera 300 líneas por 156 líneas. La `ContactosByClienteIdWebApplicationFactory` (64 líneas) podría moverse a un archivo `TestInfrastructure/` compartido entre suites de integración, pero no es obligatorio.
- OBSERVACION (W7): `TC3_GetContactosByClienteId_DoesNotReturn500_WhenClienteIdIsEmpty` acepta tanto 200 como 400 como respuestas válidas (`Assert.NotEqual(HttpStatusCode.InternalServerError, ...)`). La implementación real trata cadena vacía como "sin filtro" (retorna todos los contactos con 200). El test es correcto pero podría ser más preciso afirmando `200 OK` explícitamente para documentar el contrato actual.

---

## Validación de Estándares TEA

| Estándar | Frontend Unit | Frontend Component | Backend Integration |
|---|---|---|---|
| Estructura Given-When-Then | PASS | PASS | PASS |
| Sin hard waits | PASS | PASS | PASS |
| Auto-cleanup en fixtures | PASS | PASS | PASS |
| Selectores `data-testid` | N/A | PASS | N/A |
| Performance < 90s por test | PASS | PASS | PASS |
| Tamaño < 300 líneas | WARNING (+31) | WARNING (+94) | WARNING (+156) |
| Una assertion principal por test | WARNING (W2) | WARNING (W4) | WARNING (W7) |

---

## Resumen de Issues

### Críticos (bloqueantes): 0

### Warnings (no bloqueantes): 7

| ID | Severidad | Archivo | Descripción |
|---|---|---|---|
| W1 | Warning | useContactosByCliente.test.ts | +31 líneas sobre límite. No crítico. |
| W2 | Warning | useContactosByCliente.test.ts | Test de isLoading ubicado dentro del describe de errores (TC-3). Semánticamente pertenece a AC#5. |
| W3 | Warning | ClienteDetailView.contactos.test.tsx | +94 líneas sobre límite. Helpers de MSW repetitivos. |
| W4 | Warning | ClienteDetailView.contactos.test.tsx | TC-5 accessibility no usa axe-core real. Sólo valida presencia de heading. Gap documentado en el test. |
| W5 | Warning | ClienteDetailView.contactos.test.tsx | TC-3 assertion síncrona sobre skeleton asume timing implícito. Funcionalmente correcto pero frágil. |
| W6 | Warning | ContactosByClienteIdTests.cs | +156 líneas sobre límite. Factory podría estar en archivo separado. |
| W7 | Warning | ContactosByClienteIdTests.cs | TC-3 último test acepta 200 o 400 para `clienteId=` vacío. Podría ser más preciso afirmando 200. |

### Issues auto-corregidos: 0
(Instrucción explícita del usuario: "No hagas cambios al código")

---

## Gaps de Cobertura

- **AC#6 (deep-linking)**: Sin test de routing a nivel de página completa. Aceptable para el alcance ATDD de esta historia. Cubrir en tests E2E de la épica.
- **TC-5 Accessibility**: El test valida estructura DOM básica pero no corre axe-core. Gap conocido documentado en el propio test.
- **Retry interaction (TC-4 cuarto test)**: El test valida que `callCount > 1` pero no verifica que la UI muestre el estado de éxito posterior al retry (empty-state o lista). Cobertura parcial del flujo completo.

---

## Conclusión

Los tests de Story 4.1 tienen una calidad sólida. Cubren 5 de 6 ACs directamente. La estructura Given-When-Then es consistente y explícita en los tres archivos. El aislamiento es correcto por nivel (unit/component/integration). No se encontraron issues críticos. Los 7 warnings son cosméticos o de precisión y no comprometen la confiabilidad de la suite.
