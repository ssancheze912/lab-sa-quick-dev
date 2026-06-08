# Pipeline sa-quick-dev — Epic 1: Project Foundation & Application Shell

> Generado: 2026-06-08 | Rama: claude/bold-wright-gMu9X

## Resumen
- Historias procesadas: 3/3
- Exitosas (full pipeline): 2
- Con fallos ATDD: 1 (Story 1.2 — 11 E2E tests E2E rojos por siesa-ui-kit CSS/aria-label)
- Quality Gate (Cobertura): FAIL (76% overall — mínimo 80%)

## Detalle por Historia

| Historia | Create | ATDD | Dev | ATDD-Run | Automate | Test Review | Code Review | Estado |
|----------|--------|------|-----|----------|----------|-------------|-------------|--------|
| 1.1 — Project Initialization | ✅ | ✅ | ✅ | ⚠️ (3 intentos) | ✅ | ✅ 93/100 | ✅ PASS CON OBS | Completada |
| 1.2 — Frontend Navigation Shell | ✅ | ✅ | ✅ | ❌ (3/3) | ⏭️ | ⏭️ | ⏭️ | FAIL ATDD |
| 1.3 — Backend Database Foundation | ✅ | ✅ | ✅ | ✅ (1) | ✅ | ✅ 98/100 | ⚠️ (worktree) | Completada |

## Quality Gate

| Gate | Status | Detalle |
|------|--------|---------|
| Coverage P0 | ⚠️ CONCERNS | 80% (límite exacto — TC-E1-P0-02 y TC-E1-P0-03 sin cobertura) |
| Coverage P1 | ❌ FAIL | 67% (TC-E1-P1-05 y TC-E1-P1-06 parciales) |
| Coverage Overall | ❌ FAIL | 76% (mínimo requerido: 80%) |

## Notas Técnicas

### Story 1.1 — ATDD en 3 intentos
- Intento 1: Fallos de implementación real (AC5 RFC 7807, AC7 dirs faltantes, AC8 snake_case)
- Intento 2: Sólo errores de versión de Playwright (browsers no disponibles) → se configuró chromium-1194
- Intento 3: 54/55 GREEN (1 fallo: data-testid="app-root" faltante) → fix directo aplicado

### Story 1.2 — ATDD FAIL después de 3 intentos
Los 11 fallos E2E restantes son de naturaleza ambiental/API:
- **AC4 (5 tests)**: siesa-ui-kit no expone `data-testid="navigation-bar"` en real browser; CSS media queries controlan rail vs bar, no JS
- **AC9 (2 tests)**: siesa-ui-kit usa `aria-label="Clientes"` no `"Ir a Clientes"` en botones
- **AC1 (1 test)**: "Siesa Agents" no visible via `getByText` en running app (renderizado por siesa-ui-kit internamente)
- **AC2 (1 test)**: SPA detection falso positivo — TanStack Router dispara `framenavigated` durante navegación
- **AC9 axe (1 test)**: `window.__axeViolations__` no inyectado automáticamente
- 28/28 tests de unidad (Vitest) PASAN — implementación funcional correcta

### Story 1.3 — Code Review en estado obsoleto
El agente de code review trabajó sobre el worktree en estado anterior. La implementación real contiene:
- Migraciones EF Core iniciales creadas correctamente
- Tests con assertions reales (8 y 12 respectivamente)
- UseSnakeCaseNamingConvention correctamente registrado en DI

## Historias que requieren atención manual

### Story 1.2 — Frontend Navigation Shell
**Razón**: 11 tests E2E fallidos después de 3 intentos (ATDD no pasaron a GREEN)
**Acciones requeridas**:
1. Investigar si siesa-ui-kit expone algún mecanismo para mobile `navigation-bar` testid
2. Ajustar el aria-label de los nav items a "Ir a Clientes"/"Ir a Contactos" si siesa-ui-kit permite sobrescribirlo
3. Corregir la detección de SPA en el test AC2 (TanStack Router false positive)
4. Configurar inyección de axe-core en los tests E2E para AC9

### Quality Gate — Brechas de cobertura
1. **TC-E1-P0-02**: Automatizar test de arranque del servidor Vite en puerto 5173
2. **TC-E1-P0-03**: Añadir WebApplicationFactory test para Scalar endpoint y ausencia de Swagger
3. **TC-E1-P1-05**: Crear test de integración con PostgreSQL live para migraciones EF Core
4. **TC-E1-P1-06**: Automatizar gate de `dotnet build SiesaAgents.sln` con verificación de exit code
