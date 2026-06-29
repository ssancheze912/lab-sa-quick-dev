# Test Review Report — Story 3.1: Contact List & Search

**Date:** 2026-06-29
**Reviewer:** TEA Review Agent (testarch-test-review)
**Story:** Story 3.1 — Contact List & Search
**Verdict:** PASS CON OBSERVACIONES

---

## Files Reviewed

| File | Lines | Result |
|------|-------|--------|
| `frontend/src/modules/crm/contactos/application/contactoSchema.test.ts` | 238 | PASS |
| `frontend/src/modules/crm/contactos/presentation/ContactoListView.test.tsx` | 461 | PASS CON OBSERVACIONES |
| `backend/tests/SiesaAgents.IntegrationTests/Contactos/ContactosEndpointsTests.cs` | 249 | PASS CON OBSERVACIONES |

---

## TEA Standards Checklist

| Standard | contactoSchema.test.ts | ContactoListView.test.tsx | ContactosEndpointsTests.cs |
|----------|------------------------|--------------------------|----------------------------|
| Estructura AAA / Given-When-Then | PASS | PASS | PASS |
| Sin hard waits (`sleep`/`Thread.Sleep`) | PASS | PASS | PASS |
| Auto-cleanup / sin estado compartido | PASS | WARNING (ver W1) | WARNING (ver W2) |
| Selectores `data-testid` | N/A | PASS | N/A |
| Performance < 90s por test | PASS | PASS | PASS |
| Tamaño < 300 líneas | PASS (238) | WARNING (461 > 300) | PASS (249) |
| Una assertion principal por test (atómico) | PASS | PASS | WARNING (ver W3) |

---

## Cobertura de Acceptance Criteria

| AC | Descripción | Tests que lo cubren | Estado |
|----|-------------|---------------------|--------|
| AC#1 | Lista de contactos en `/contactos` con Nombre, Cargo, Email | TC-E3-P0-01, TC-E3-P1-04 | CUBIERTO |
| AC#2 | Filtro en tiempo real por Nombre o Email, < 1s con 1.000 registros | TC-E3-P1-01, TC-E3-P1-02, TC-E3-P1-03, TC-E3-SCHEMA-* | CUBIERTO |
| AC#3 | `EmptyState` con mensaje en español cuando no hay contactos | TC-E3-P0-02, backend empty-array test | CUBIERTO |
| AC#4 | `ErrorPanel` con botón "Reintentar" al fallar el backend | TC-E3-P0-03 | CUBIERTO |

Cobertura total: **4/4 ACs cubiertos**.

---

## Issues por Severidad

### CRÍTICOS — ninguno

### WARNINGS

**W1 — `ContactoListView.test.tsx`: server.close() en afterEach sin server.listen global puede dejar handlers activos entre suites**

- Líneas: 39-47
- La instancia `server` se crea una sola vez fuera de `beforeEach` con `setupServer()` vacío, pero se llama `server.listen()` en `beforeEach` y `server.close()` en `afterEach`. El patrón es correcto para aislamiento por test, pero si algún test falla antes de que `afterEach` se ejecute (error no capturado), el servidor puede quedar en estado inconsistente para el siguiente. El patrón recomendado con MSW 2 en Vitest es usar `beforeAll`/`afterAll` para `listen`/`close` y `afterEach` solo para `resetHandlers`. Sin embargo, el patrón actual funciona y no genera estado compartido entre tests dentro de la misma suite.
- Severidad: WARNING (no bloquea; es una mejora de robustez)
- Impacto: Bajo. Los tests pasaron 17/17.

**W2 — `ContactosEndpointsTests.cs`: `_client` y `_factory` compartidos entre los tests TC-E3-P1-04 y TC-E3-ContentType**

- Líneas: 67-73 (constructor) y tests en líneas 89 y 207
- Los tests `TC_E3_P1_04_GetContactos_Returns200_WithDirectArrayAndAllDtoFields` y `GetContactos_Returns_ContentTypeApplicationJson` comparten la misma instancia de `_factory` (via `IClassFixture`) y la misma base de datos en-memoria (`IntegrationTestDb_Contactos`). El seed de `TC-E3-P1-04` (2 registros) puede persistir cuando corre `GetContactos_Returns_ContentTypeApplicationJson` (que seedea 1 registro adicional), haciendo que este segundo test tenga 3 registros en lugar de 1. Esto no rompe las assertions actuales, pero viola el principio de aislamiento.
- El tercer test (`GetContactos_Returns200_WithEmptyArray_WhenNoneExist`) ya usa correctamente una factory independiente (`using var factory = new ContactosWebApplicationFactory()`).
- Severidad: WARNING (no bloquea assertions actuales, pero puede generar flakiness si se añaden más seeds)
- Recomendación: Usar `"IntegrationTestDb_Contactos_" + Guid.NewGuid()` como nombre de base de datos por instancia, o separar en fixtures distintas.

**W3 — `ContactosEndpointsTests.cs`: TC-E3-P1-04 tiene múltiples assertions en un solo test**

- Líneas: 89-166
- El test `TC_E3_P1_04_GetContactos_Returns200_WithDirectArrayAndAllDtoFields` valida en un solo método: status 200, formato array JSON, cantidad de items, y 7 campos DTO por cada item (id, nombre, cargo, telefono, email, clienteId, createdAt). Esto es un test de contrato de API que cubre muchos aspectos a la vez.
- Esta es una práctica aceptable para tests de contrato/integración de API donde se verifica el shape completo del DTO en una sola llamada HTTP. El trade-off entre atomicidad y eficiencia (evitar N llamadas HTTP) justifica la excepción.
- Severidad: WARNING informativo (patrón aceptable para integration tests de API, no requiere cambio)

**W4 — `ContactoListView.test.tsx`: Tamaño excede 300 líneas (461 líneas)**

- El archivo tiene 461 líneas, superando el límite TEA de 300. La causa es la alta cobertura (7 test suites con 17 casos). No hay código redundante evidente — la densidad es apropiada.
- Recomendación: Considerar en futuras stories separar los tests de performance (`TC-E3-P1-03`) en un archivo dedicado `ContactoListView.perf.test.tsx`.
- Severidad: WARNING menor (cobertura justifica el tamaño; no requiere cambio en esta story)

---

## Análisis Detallado por Archivo

### 1. `contactoSchema.test.ts` (238 líneas) — PASS

**Estructura AAA:** Correcta. Todos los tests usan comentarios `// GIVEN / // WHEN / // THEN` explícitos.

**Atomicidad:** Correcta. Cada test verifica un campo o condición específica. Los 4 grupos de `describe` mapean directamente a los 4 test cases (TC-E3-SCHEMA-01 a TC-E3-SCHEMA-04).

**Aislamiento:** Correcto. No hay estado mutable compartido entre tests. El `validBase` en `TC-E3-SCHEMA-04` es una constante local al `describe` y no produce side effects.

**Compatibilidad Zod v4:** El schema usa una envoltura de compatibilidad (`errors` como alias de `issues`). Los tests acceden a `result.error.errors` — funciona con la implementación actual. Esto es un workaround aceptable documentado en las notas de desarrollo.

**Cobertura:** Cubre validación de campos requeridos (vacío y ausente), formato de email, y preservación de datos válidos. No cubre casos edge como espacios en blanco (el schema usa `.trim().min(1)`, lo que los rechazaría), pero esto es suficiente para AC#2 del story.

**Sin issues.**

---

### 2. `ContactoListView.test.tsx` (461 líneas) — PASS CON OBSERVACIONES

**Estructura AAA:** Correcta en todos los tests. Comentarios `// GIVEN / // WHEN / // THEN` presentes y bien delimitados.

**MSW + QueryClient:** Patrón correcto. Cada test obtiene un `QueryClient` fresco via `renderContactoListView()`. Esto garantiza que la caché de TanStack Query no se comparte entre tests.

**`data-testid`:** Los selectores usados en los tests (`contactos-list-skeleton`, `contacto-item-${id}`, `contactos-empty-state`, `contactos-error-panel`, `contactos-retry-button`, `contactos-search-input`) están todos presentes en la implementación real (`ContactoListView.tsx` líneas 21, 80, 54, 31, 37, 66). Consistencia verificada.

**Test de performance (TC-E3-P1-03):** Usa `performance.now()` para medir tiempo real de filtrado. El threshold de 150ms es apropiado (bien por debajo del NFR1 de 1s). El `waitFor` con `timeout: 10000` para cargar 1.000 registros es razonable.

**Test de retry (TC-E3-P0-03, tercer caso):** El patrón de `server.resetHandlers()` + `server.use(successHandler)` para simular recuperación después de error es correcto.

**Sin hard waits.** Todos los tests usan `waitFor` de RTL.

**Issue W1** (detallado arriba): patrón `listen/close` en `beforeEach/afterEach` en lugar de `beforeAll/afterAll`.

**Issue W4** (detallado arriba): 461 líneas > 300.

---

### 3. `ContactosEndpointsTests.cs` (249 líneas) — PASS CON OBSERVACIONES

**Estructura AAA:** Correcta. Comentarios `// GIVEN / // WHEN / // THEN` explícitos en los 3 tests.

**Nomenclatura:** Los nombres de métodos son descriptivos aunque no siguen la convención `Given_When_Then` de xUnit idiomático. `TC_E3_P1_04_GetContactos_Returns200_WithDirectArrayAndAllDtoFields` es descriptivo y rastrea al test case ID. Los otros dos tests (`GetContactos_Returns200_WithEmptyArray_WhenNoneExist`, `GetContactos_Returns_ContentTypeApplicationJson`) son descriptivos y siguen convención `Verb_Condition_ExpectedResult`.

**`WebApplicationFactory`:** La eliminación de descriptores de Npgsql/EF Core antes de registrar InMemory es el patrón correcto para evitar conflictos de providers. Documentado en Dev Notes.

**Validación de contrato DTO:** TC-E3-P1-04 verifica todos los campos del `ContactoDto` incluyendo: UUID válido para `id`, strings no-vacíos para `nombre`/`email`, string nullable UUID para `clienteId`, y DateTimeOffset con timezone para `createdAt`. Cobertura de contrato completa.

**Issue W2** (detallado arriba): estado compartido entre tests de la misma `IClassFixture`.

**Issue W3** (detallado arriba): múltiples assertions en TC-E3-P1-04 (aceptable para contrato API).

**Test de Content-Type:** Valida `application/json` como media type. Útil para detectar regresiones en negociación de contenido.

---

## Traceability — Test IDs vs Acceptance Criteria

| Test ID | AC | Verificado |
|---------|----|-----------|
| TC-E3-SCHEMA-01 | AC#2 (validación Zod) | Si |
| TC-E3-SCHEMA-02 | AC#2 | Si |
| TC-E3-SCHEMA-03 | AC#2 (formato email) | Si |
| TC-E3-SCHEMA-04 | AC#2 | Si |
| TC-E3-P0-01 | AC#1 | Si |
| TC-E3-P0-02 | AC#3 | Si |
| TC-E3-P0-03 | AC#4 | Si |
| TC-E3-P1-01 | AC#2 (filtro nombre) | Si |
| TC-E3-P1-02 | AC#2 (filtro email) | Si |
| TC-E3-P1-03 | AC#2 (NFR1 performance) | Si |
| TC-E3-P2-01 | AC#1 (loading state) | Si |
| TC-E3-P1-04 | AC#1, AC#4 (backend) | Si |

**Total:** 12 test cases / 4 ACs — cobertura completa.

---

## Resumen de Issues

| ID | Severidad | Archivo | Descripción | Auto-corregible |
|----|-----------|---------|-------------|-----------------|
| W1 | WARNING | ContactoListView.test.tsx | `server.listen/close` en `beforeEach/afterEach` — patrón menos robusto que `beforeAll/afterAll` | No (requiere decisión de diseño) |
| W2 | WARNING | ContactosEndpointsTests.cs | Base de datos en-memoria compartida entre tests de la misma clase fixture | No (requiere refactor de factory) |
| W3 | WARNING | ContactosEndpointsTests.cs | Múltiples assertions en TC-E3-P1-04 (aceptable para contrato API) | No aplica |
| W4 | WARNING | ContactoListView.test.tsx | 461 líneas > límite TEA de 300 | No (justificado por cobertura) |

**Issues críticos:** 0
**Warnings:** 4 (ninguno bloquea funcionalidad ni cobertura de ACs)
**Auto-corregidos:** 0 (los warnings requieren decisiones de diseño, no son errores mecánicos)

---

## Veredicto Final

**PASS CON OBSERVACIONES**

Los tests cubren los 4 ACs de la historia con 12 test cases distribuidos apropiadamente entre unit (schema), component (RTL+MSW) e integration (xUnit+WebApplicationFactory). La estructura AAA es consistente, no hay hard waits, los selectores son `data-testid`, y el test de performance valida NFR1. Los 4 warnings son mejoras de robustez que no impactan la cobertura ni los resultados actuales (37 tests PASS: 16 unit + 17 component + 3 integration).
