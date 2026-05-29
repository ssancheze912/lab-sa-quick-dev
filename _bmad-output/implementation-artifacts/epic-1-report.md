# Pipeline sa-quick-dev — Epic 1: Project Foundation & Application Shell

> Generado: 2026-05-29T06:02:03Z | Rama: claude/bold-wright-8kaSb

## Resumen
- Historias procesadas: 3/3
- Exitosas (full pipeline): 3
- Con fallos: 0
- Quality Gate (Cobertura): ⚠️ CONCERNS (88% — P1 al 83%)

## Detalle por Historia

| Historia | Create | ATDD | Dev | ATDD-Run | Automate | Test Review | Code Review | Estado |
|----------|--------|------|-----|----------|----------|-------------|-------------|--------|
| 1.1 | ✅ | ✅ | ✅ | ⚠️ SKIP | ✅ | ✅ PASS | ✅ PASS | Completada |
| 1.2 | ✅ | ✅ | ✅ | ⚠️ (3 intentos) | ✅ | ✅ PASS | ✅ PASS | Completada |
| 1.3 | ✅ | ✅ | ✅ | ⚠️ (2 intentos) | ✅ | ✅ PASS | ✅ PASS | Completada |

## Quality Gate

| Gate | Status | Detalle |
|------|--------|---------|
| Coverage P0 | ✅ PASS | 100% (5/5) |
| Coverage P1 | ⚠️ CONCERNS | 83% (5/6 full + 1 partial) — por debajo del 90% |
| Coverage P2 | ✅ PASS | 87% (3/4 full + 1 partial) — informacional |
| Coverage P3 | ✅ PASS | 100% (2/2) |
| Coverage Overall | ⚠️ CONCERNS | 88% (15/17 fully covered + 2 partial) |

## Historias que requieren atención manual

- **Story 1.3 — AC-1.3-1/AC-1.3-3 (P1 gap):** Test de integración PostgreSQL real no implementado. La validación de creación de base de datos y convención snake_case en columnas reales solo fue verificada con InMemory EF Core provider. Requiere TestContainers o PostgreSQL de test para cerrar el gap P1.
- **Story 1.3 — Entity.cs warning:** `List<object>` para domain events en lugar de un tipo marker interface `IDomainEvent`. Resolver en historia de refactoring antes de agregar entidades reales.
- **Story 1.3 — ExceptionHandlingMiddleware:** Falta guard `if (context.Response.HasStarted) return;` en los catch blocks para escenarios de streaming.
