# Test Review — Story 3.2: Contact Detail View

**Fecha:** 2026-06-29
**Story:** 3.2 — Contact Detail View
**Veredicto:** PASS CON OBSERVACIONES

---

## Archivos Revisados

| Archivo | Líneas | Límite (300) | Estado |
|---------|--------|--------------|--------|
| `frontend/src/modules/crm/contactos/application/useContacto.test.ts` | 271 | 300 | PASS |
| `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.test.tsx` | 332 | 300 | WARNING: excede límite |
| `backend/tests/SiesaAgents.IntegrationTests/Contactos/ContactoByIdEndpointTests.cs` | 346 | 300 | WARNING: excede límite |

---

## 1. Estructura GWT / AAA

### useContacto.test.ts — PASS
- Todos los tests usan comentarios `// GIVEN / // WHEN / // THEN` explícitos.
- La estructura es coherente y cada test tiene un único comportamiento verificado.
- Separación clara en `describe` blocks por TC (TC-1, TC-2, TC-3).

### ContactoDetailView.test.tsx — PASS CON OBSERVACIÓN
- GWT correcto en la mayoría de tests.
- **Observación (WARNING):** El test `'should trigger a new fetch when Reintentar button is clicked'` (línea 222) tiene dos comentarios `// WHEN:` en el mismo test (línea 229 y 238), lo que técnicamente viola la estructura GWT de acción única. El test simula un flujo de dos acciones (esperar error → hacer clic en Reintentar), lo cual es válido para este caso de uso pero debería documentarse explícitamente como test de flujo compuesto, no GWT estándar.

### ContactoByIdEndpointTests.cs — PASS
- Estructura Given-When-Then documentada en los XML doc comments (`/// <summary>`).
- Todos los métodos siguen el patrón `Assert.*` tras las acciones HTTP.
- Sin lógica condicional dentro de los tests.

---

## 2. Cobertura de Acceptance Criteria

### Mapa de cobertura

| AC | Descripción | useContacto.test.ts | ContactoDetailView.test.tsx | ContactoByIdEndpointTests.cs |
|----|-------------|--------------------|-----------------------------|------------------------------|
| #1 | Campos mostrados + URL route | TC-1 (indirecto) | TC-2, TC-6 | TC-1 |
| #2 | Deep link / acceso directo por URL | TC-1 (indirecto) | No cubierto | TC-1 |
| #3 | 404 → "Contacto no encontrado" | TC-2 | TC-4 | TC-2 |
| #4 | ErrorPanel + Reintentar en fallo backend | Implícito TC-2 | TC-3 | N/A |
| #5 | Skeleton loading | TC-3 | TC-1 | N/A |
| #6 | Botón "Editar" visible | N/A | TC-5 | N/A |
| #7 | Botón "Eliminar" visible | N/A | TC-5 | N/A |

**Observación (WARNING):** AC #2 (acceso directo por deep link) no tiene cobertura explícita en el frontend. La lógica del hook `useContacto(id)` la cubre implícitamente, pero no existe un test de integración de ruta (TanStack Router) que valide que el `contactoId` del parámetro URL llega correctamente al componente. Esto es aceptable en el scope de unit/component tests (la ruta se valida en Story 3.4 con rutas E2E), pero queda como gap de cobertura explícita.

**Observación (WARNING):** TC-6 en la story especificaba una accessibility check vía `axe` (`@axe-core/react` o similar). Este test no está presente en `ContactoDetailView.test.tsx`. La anotación en el header del archivo lista TC-6 como "Field labels rendered in Spanish" (que sí existe), pero la story task original indicaba "Accessibility check via axe — no critical violations" como TC-6. La verificación de accesibilidad WCAG 2.1 AA es un requisito de la story que queda sin cobertura automatizada.

---

## 3. Nombres Descriptivos

### useContacto.test.ts — PASS
- Todos los `it()` usan nombres en inglés claros, siguiendo el patrón `should [verb] [condition] when [context]`.
- Los `describe()` blocks incluyen el TC-ID para trazabilidad directa.
- Ejemplo representativo: `'should expose isError true when the API returns 404'` — correcto.

### ContactoDetailView.test.tsx — PASS
- Nombres de test descriptivos y en inglés consistente.
- Los `describe` blocks mapean explícitamente a TC-IDs y ACs.
- Patrón consistente con `useContacto.test.ts`.

### ContactoByIdEndpointTests.cs — PASS
- Método names siguen convención `TC{n}_{Verb}_{Condition}_{When}Context` (ej: `TC1_GetContactoById_Returns200_WithContactoDto_WhenContactExists`).
- Los XML doc comments con Given/When/Then enriquecen la documentación de intención.
- Consistente con el estilo del proyecto C#.

---

## 4. Aislación por Nivel

### Frontend — PASS

**useContacto.test.ts:**
- `createWrapper()` instancia un `QueryClient` nuevo por test — no hay estado compartido entre tests.
- MSW `server.listen()` en `beforeEach` y `server.close()` en `afterEach` — correcto ciclo de vida.
- `resetContactoCounter()` en `beforeEach` garantiza IDs determinísticos y no colisionantes.

**ContactoDetailView.test.tsx:**
- `renderContactoDetailView()` helper crea un `QueryClient` fresco por llamada — aislación correcta.
- MSW server reiniciado (`server.resetHandlers()` + `server.close()`) en `afterEach`.
- `resetContactoCounter()` garantiza que los IDs de factory no colisionen entre tests.

### Backend — PASS CON OBSERVACIÓN

**ContactoByIdEndpointTests.cs:**
- `ContactoByIdWebApplicationFactory` con `DatabaseName = Guid.NewGuid()` garantiza bases de datos in-memory únicas por instancia — aislación correcta.
- **Observación (WARNING):** Los tests TC-1 que necesitan sembrar datos (`TC1_GetContactoById_Returns200_WithContactoDto_WhenContactExists` y `TC1_GetContactoById_Returns_ContentTypeApplicationJson_WhenContactExists`) crean una `uniqueFactory` nueva localmente (líneas 91, 167) en lugar de usar la `_factory` del `IClassFixture`. Sin embargo, la `uniqueFactory` local **no está dispuesta explícitamente** (no hay `using var uniqueFactory` ni `await uniqueFactory.DisposeAsync()`). Esto puede generar resource leaks menores durante la ejecución de tests, aunque no afecta el resultado de los tests dado que los procesos se limpian al finalizar la suite.
- Los tests TC-2 y TC-3 usan correctamente `_client` (de `IClassFixture`) con el `DatabaseName` compartido, pero como solo hacen reads sobre IDs que nunca fueron sembrados, no hay contaminación de estado entre tests.

---

## 5. Selectores data-testid

### ContactoDetailView.test.tsx — PASS
Todos los selectores de elementos UI usan `data-testid` canónicos:
- `contacto-detail-panel`
- `contacto-detail-skeleton`
- `contacto-detail-error-panel`
- `contacto-detail-retry-button`
- `contacto-edit-button`
- `contacto-delete-button`

No hay selectores por clase CSS, texto arbitrario como mecanismo principal, ni queries frágiles.
Los selectores por texto (`getByText`) se usan únicamente para verificar contenido de datos (nombres, campos), no para encontrar elementos estructurales — uso correcto.

---

## 6. Performance (Hard Waits)

- **Sin `setTimeout` ni `Thread.Sleep` ni `Task.Delay` en código de test.** PASS.
- Los delays están en los MSW handlers (`delay(300)` en useContacto.test.ts y `delay(150)` en el handler de carga), que es el patrón correcto para simular latencia sin hard-coding waits en los propios tests.
- `waitFor` con `timeout: 2000ms` y `timeout: 3000ms` son timeouts de espera async, no hard waits — PASS.
- Sin tests que excedan riesgo de 90 segundos. Los delays configurados son 150–300ms máximo.

---

## 7. Atomicidad (Una Assertion Principal por Test)

### PASS con observaciones
- La mayoría de tests verifican un estado principal y usan assertions secundarias como guardia o verificación de estado precondición.
- **Observación (minor):** `TC1_GetContactoById_Returns200_WithContactoDto_WhenContactExists` verifica 7 campos del `ContactoDto` en un solo test (id, nombre, cargo, telefono, email, clienteId, createdAt). Esto es un test de contrato de API completo, no es un defecto pero desvía del patrón atómico. La práctica es aceptable en integration tests donde verificar todos los campos del contrato en una sola llamada HTTP es pragmático.
- El test `TC-2 shows all contact fields` también hace múltiples assertions (4 campos). Mismo comentario: aceptable para tests de contrato de renderizado.

---

## 8. Issues Detectados

### Críticos
Ninguno.

### Warnings
1. **W-01: Archivos exceden 300 líneas.**
   - `ContactoDetailView.test.tsx`: 332 líneas.
   - `ContactoByIdEndpointTests.cs`: 346 líneas.
   - Acción sugerida: Extraer tests de flujo compuesto (TC-3 retry) a un archivo separado `ContactoDetailView.retry.test.tsx`, y separar los `Fact` por grupo TC en C# (`ContactoByIdNotFoundTests.cs` para TC-2).

2. **W-02: AC #2 (deep link) sin cobertura explícita en frontend.**
   - No existe test de integración de ruta (TanStack Router) que valide que `contactoId` del parámetro URL llega al componente.
   - Acción sugerida: Agregar test de ruta en `contactos.$contactoId.test.tsx` que renderice la ruta con `createMemoryRouter` y verifique que `ContactoDetailView` recibe el `contactoId` correcto.

3. **W-03: Accessibility (axe) no implementada.**
   - La story task 6 especifica "Accessibility check via axe — no critical violations" pero no existe ningún test de accesibilidad automatizado.
   - Acción sugerida: Agregar test con `@axe-core/react` en `ContactoDetailView.test.tsx` o en archivo separado `ContactoDetailView.a11y.test.tsx`.

4. **W-04: Resource leak en `uniqueFactory` en C# TC-1 tests.**
   - Las instancias `uniqueFactory` (líneas 91, 167) no se disponen explícitamente.
   - Acción sugerida: Cambiar a `await using var uniqueFactory = new ContactoByIdWebApplicationFactory();`.

5. **W-05: Test con doble-WHEN en TC-3 retry (flujo compuesto).**
   - El test `'should trigger a new fetch when Reintentar button is clicked'` tiene dos acciones (`// WHEN:`) que violan GWT estricto.
   - El test es funcionalmente válido pero debería ser comentado como "integration flow test" para distinguirlo de tests GWT unitarios.

### Observaciones Menores (sin impacto)
- El archivo `modules/test/factories/contacto.factory.ts` es un re-export de `test/factories/contacto.factory.ts`. El path doble podría crear confusión; se recomienda unificar en el path canónico `test/factories/`.
- Los tests de TC-2 en backend (no encontrado) usan UUIDs con patrones predecibles (`...000099`, `...000088`, `...000077`, `...000000`). No es un problema dado el aislamiento por `IClassFixture`, pero hardcodear múltiples UUIDs diferentes entre tests podría simplificarse usando `Guid.NewGuid()`.

---

## 9. Resumen de Cobertura por AC

| AC | Cobertura | Nivel |
|----|-----------|-------|
| #1 | Cubierto | Unit + Component + Integration |
| #2 | Parcial | Integration backend (TC-1); frontend sin test de ruta explícito |
| #3 | Cubierto | Unit + Component + Integration |
| #4 | Cubierto | Component |
| #5 | Cubierto | Unit + Component |
| #6 | Cubierto | Component |
| #7 | Cubierto | Component |

---

## 10. Veredicto Final

**PASS CON OBSERVACIONES**

Los tests cumplen con los estándares esenciales del TEA: estructura GWT/AAA presente, sin hard waits, aislación correcta por fixture, uso consistente de `data-testid`, cobertura de los ACs principales (#1, #3, #4, #5, #6, #7). Los warnings identificados (tamaño de archivo, AC #2 sin cobertura de ruta frontend, axe faltante, resource leak en C#) no bloquean el avance de la historia pero deben ser abordados antes del cierre de la épica.

**Issues auto-corregidos:** Ninguno (instrucción del usuario: no modificar código).
